const UI = {
    chartPH: null,
    chartLic: null,

    init() {
        this.cargarMeses();
        this.cargarAnios();
        this.fillCoordFilter();
        this.renderTabla();
        this.graficarPH();
        this.graficarLicencias();
    },

    cargarMeses() {
        const sel = document.getElementById("mesSelect");
        sel.innerHTML = Util.meses.map((m,i)=>
            `<option value="${i}" ${i===Estado.mes ? "selected":""}>${m}</option>`
        ).join("");
        sel.onchange = () => { Estado.mes = parseInt(sel.value); this.renderTabla(); };
    },

    cargarAnios() {
        const sel = document.getElementById("anioSelect");
        const actual = new Date().getFullYear();
        let ops = "";
        for (let a = actual - 3; a <= actual + 1; a++) {
            ops += `<option value="${a}" ${a===Estado.anio?"selected":""}>${a}</option>`;
        }
        sel.innerHTML = ops;
        sel.onchange = () => { Estado.anio = parseInt(sel.value); this.renderTabla(); };
    },

    fillCoordFilter() {
        const sel = document.getElementById("coordFilter");
        const coords = [...new Set(Estado.empleados.map(e => e.coordinador).filter(Boolean))];

        sel.innerHTML = `<option value="">(Todos los coordinadores)</option>` +
            coords.map(c => `<option value="${c}">${c}</option>`).join("");
    },

    /* =======================================================
       =============== RENDER TABLA PRINCIPAL =================
       ======================================================= */
    renderTabla() {
        const cont = document.getElementById("tabla-container");

        const filtro = document.getElementById("coordFilter").value;

        // Agrupar empleados por coordinador
        const grupos = {};
        Estado.empleados.forEach(e => {
            const coord = e.coordinador || "(Sin coord)";
            if (!grupos[coord]) grupos[coord] = [];
            grupos[coord].push(e);
        });

        let html = "";

        const diasMes = new Date(Estado.anio, Estado.mes + 1, 0).getDate();

        let colorGrupo = true;

        for (const coord of Object.keys(grupos)) {

            if (filtro && coord !== filtro) continue;

            html += `
            <h3 style="margin-top:20px;">Coordinador: ${coord}</h3>
            <table>
            <thead>
                <tr>
                    <th>Legajo</th>
                    <th>Empleado</th>
                    ${[...Array(diasMes)].map((_,i)=>
                        `<th>${i+1}</th>`
                    ).join("")}
                </tr>
            </thead>
            <tbody>
            `;

            grupos[coord].forEach(emp => {

                const fondo = colorGrupo ? "#f4f4f4" : "white";

                html += `<tr style="background:${fondo}">`;
                html += `<td>${emp.legajo}</td>`;
                html += `<td>${emp.nombre}</td>`;

                for (let d = 1; d <= diasMes; d++) {
                    const fecha = new Date(Estado.anio, Estado.mes, d);
                    const diaSemana = fecha.getDay();

                    let clase = "";

                    if (diaSemana === 6 || diaSemana === 0) clase += " finsemana ";

                    const lic = Estado.licencias.find(l =>
                        Estado.empleados[l.empleado].nombre === emp.nombre &&
                        isDateInRangeYMD(fecha, l.inicio, l.fin)
                    );

                    if (lic) {
                        const tipo = Licencias.tipos[lic.tipo];
                        html += `<td style="background:${tipo.color};color:white;font-size:11px;font-weight:bold;">${tipo.letra}</td>`;
                        continue;
                    }

                    if (diaSemana >= 1 && diaSemana <= 5 && emp.checks[diaSemana-1]) {
                        clase += " trabaja ";
                    } else {
                        clase += " no-trabaja ";
                    }

                    html += `<td class="${clase.trim()}"></td>`;
                }

                html += `</tr>`;
            });

            html += `</tbody></table>`;
            colorGrupo = !colorGrupo;
        }

        cont.innerHTML = html;

        this.graficarPH();
        this.graficarLicencias();
    },

    /* =======================================================
       =============== GRÁFICO PRESENCIAL / HOME ==============
       ======================================================= */
    graficarPH() {
        const canvas = document.getElementById("graficoPH");
        if (!canvas) return;

        const ctx = canvas.getContext("2d");

        if (this.chartPH) this.chartPH.destroy();

        let pres = 0, home = 0;

        Estado.empleados.forEach(emp => {
            emp.checks.forEach(c => { if (c) pres++; else home++; });
        });

        this.chartPH = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Presencial", "Home"],
                datasets: [{
                    data: [pres, home],
                    backgroundColor: ["#007bff", "#ff9900"]
                }]
            },
            options: {
                responsive: true
            }
        });
    },

    /* =======================================================
       ================= GRÁFICO LICENCIAS ====================
       ======================================================= */
    graficarLicencias() {
        const canvas = document.getElementById("graficoLicencias");
        if (!canvas) return;

        const ctx = canvas.getContext("2d");

        if (this.chartLic) this.chartLic.destroy();

        const conteo = {};
        Licencias.tipos.forEach(t => conteo[t.letra] = 0);

        Estado.licencias.forEach(l => {
            const t = Licencias.tipos[l.tipo];
            conteo[t.letra]++;
        });

        const labels = Licencias.tipos.map(t => t.letra);
        const valores = Licencias.tipos.map(t => conteo[t.letra]);
        const colores = Licencias.tipos.map(t => t.color);

        const total = valores.reduce((a,b)=>a+b,0);
        if (total === 0) {
            canvas.style.opacity = 0.4;
            ctx.font = "14px Arial";
            ctx.fillText("No hay licencias cargadas", 10, 40);
            return;
        }

        canvas.style.opacity = 1;

        this.chartLic = new Chart(ctx, {
            type: "pie",
            data: {
                labels,
                datasets: [{
                    data: valores,
                    backgroundColor: colores
                }]
            },
            options: {
                responsive: true
            }
        });
    },

    /* =======================================================
       ==================== EXPORTAR PDF ======================
       ======================================================= */
    async exportarPDF() {
        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4"
        });

        const ancho = pdf.internal.pageSize.getWidth();
        const alto = pdf.internal.pageSize.getHeight();

        const mes = Util.meses[Estado.mes];
        const titulo = `Asistencia - ${mes} ${Estado.anio}`;

        pdf.setFontSize(16);
        pdf.text(titulo, ancho/2, 12, { align:"center" });

        const tabla = document.getElementById("tabla-container");
        const canvas = await html2canvas(tabla, { scale:2 });
        const img = canvas.toDataURL("image/png");
        const props = pdf.getImageProperties(img);

        let w = ancho - 20;
        let h = (props.height * w) / props.width;

        let y = 20;
        let restante = h;

        while (restante > 0) {
            pdf.addImage(img, "PNG", 10, y, w, h);
            restante -= (alto - 20);

            if (restante > 0) {
                pdf.addPage();
                pdf.text(`${titulo} (cont.)`, ancho/2, 12, { align:"center" });
                y = 20;
            }
        }

        pdf.addPage();
        pdf.text(`Resumen del Mes`, ancho/2, 12, { align:"center" });

        const resumen = document.getElementById("estadisticas-container");
        const canvas2 = await html2canvas(resumen, { scale:2 });
        const img2 = canvas2.toDataURL("image/png");

        const props2 = pdf.getImageProperties(img2);
        const h2 = (props2.height * w) / props2.width;

        pdf.addImage(img2, "PNG", 10, 20, w, h2);

        pdf.save(`asistencia_${mes}_${Estado.anio}.pdf`);
    }
};
