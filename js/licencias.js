const Licencias = {
    tipos: [
        { nombre:"Vacaciones", color:"#7cd67c", letra:"V" },
        { nombre:"Falta c/Aviso", color:"#ffcc00", letra:"FA" },
        { nombre:"Estudio", color:"#6699ff", letra:"LE" },
        { nombre:"Festividad", color:"#ff9966", letra:"LF" },
        { nombre:"Médica", color:"#cc6666", letra:"LM" },
        { nombre:"Baja", color:"#999999", letra:"B" },
        { nombre:"Matrimonio", color:"#cc99ff", letra:"LMA" },
        { nombre:"Paternidad", color:"#99cc99", letra:"LP" },

        /* Nuevos tipos */
        { nombre:"Compensación Presencia", color:"#60b9ff", letra:"CP" },
        { nombre:"Cambio Home", color:"#ddddee", letra:"CH" }
    ],

    open() {
        licenciasModal.style.display = "block";
        this.render();
    },

    close() {
        licenciasModal.style.display = "none";
    },

    guardar() {
        const empleado = parseInt(document.getElementById("licEmpleado").value);
        const tipo = parseInt(document.getElementById("licTipo").value);
        const inicio = document.getElementById("licInicio").value;
        const fin = document.getElementById("licFin").value;

        if (!inicio || !fin) return alert("Debe indicar inicio y fin");

        Estado.licencias.push({ empleado, tipo, inicio, fin });

        this.render();
        UI.renderTabla();
    },

    eliminar(i) {
        Estado.licencias.splice(i, 1);
        this.render();
        UI.renderTabla();
    },

    renderLista() {
        const empSel = parseInt(document.getElementById("licEmpleado").value);
        const cont = document.getElementById("licenciasLista");

        const lista = Estado.licencias.filter(l => l.empleado === empSel);

        if (lista.length === 0) {
            cont.innerHTML = "<i>No hay licencias cargadas</i>";
            return;
        }

        cont.innerHTML = lista.map((l, idx) => {
            const emp = Estado.empleados[l.empleado].nombre;
            const tipo = this.tipos[l.tipo];

            return `
            <div style="background:#eee;padding:6px;margin-bottom:6px;border-radius:5px;">
                <b>${emp}</b> — ${tipo.nombre} (${l.inicio} → ${l.fin})
                <button onclick="Licencias.eliminar(${Estado.licencias.indexOf(l)})"
                    style="float:right;">🗑️</button>
            </div>`;
        }).join("");
    },

    render() {
        const c = document.getElementById("licenciasContent");

        c.innerHTML = `
        <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:flex-end;">
            <div>
                <label>Empleado</label><br>
                <select id="licEmpleado" onchange="Licencias.renderLista()">
                    ${Estado.empleados.map((e,i)=>`
                        <option value="${i}">${e.nombre}</option>`).join("")}
                </select>
            </div>

            <div>
                <label>Tipo</label><br>
                <select id="licTipo">
                    ${this.tipos.map((t,i)=>`
                        <option value="${i}">${t.nombre}</option>`).join("")}
                </select>
            </div>

            <div>
                <label>Inicio</label><br>
                <input type="date" id="licInicio">
            </div>

            <div>
                <label>Fin</label><br>
                <input type="date" id="licFin">
            </div>
        </div>

        <hr>
        <div id="licenciasLista"></div>
        `;

        this.renderLista();
    }
};
