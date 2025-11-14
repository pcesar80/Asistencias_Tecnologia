/* ui.js - renderizado, tablas, gráficos, export, import */
let chartPH = null;
let chartLic = null;

const UI = {
  init(){
    // populate months and years
    const mesSel = document.getElementById("mesSelect");
    mesSel.innerHTML = Util.meses.map((m,i)=>`<option value="${i}">${m}</option>`).join('');
    mesSel.value = Estado.mes;

    const anioSel = document.getElementById("anioSelect");
    let yhtml = '';
    for(let a=2020;a<=2035;a++) yhtml += `<option value="${a}">${a}</option>`;
    anioSel.innerHTML = yhtml;
    anioSel.value = Estado.anio;

    this.fillCoordFilter();
    this.renderTabla();
  },

  fillCoordFilter(){
    const f = document.getElementById("coordFilter");
    const set = new Set(Estado.empleados.map(e=>e.coordinador).filter(x=>x));
    f.innerHTML = `<option value="">(Todos los coordinadores)</option>` + [...set].map(c=>`<option value="${c}">${c}</option>`).join('');
  },

  renderTabla(){
    Estado.mes = parseInt(document.getElementById("mesSelect").value);
    Estado.anio = parseInt(document.getElementById("anioSelect").value);
    guardarEstado();

    const diasMes = new Date(Estado.anio, Estado.mes+1, 0).getDate();
    const cont = document.getElementById("tabla-container");
    const filtro = document.getElementById("coordFilter").value;

    const empFil = Estado.empleados.filter(e => !filtro || e.coordinador === filtro);
    const empOrd = [...empFil].sort((a,b)=>{
      const A = a.coordinador||""; const B = b.coordinador||"";
      if(A<B) return -1; if(A>B) return 1;
      return a.nombre.localeCompare(b.nombre);
    });

    let grupos = {};
    empOrd.forEach(e=>{
      const c = e.coordinador || "(Sin coordinador)";
      if(!grupos[c]) grupos[c]=[];
      grupos[c].push(e);
    });

    const tonos=["#f7f7f7","#ffffff"];
    let html = "<table><thead><tr><th>Legajo</th><th>Empleado</th>";
    for(let d=1; d<=diasMes; d++){
      const day = new Date(Estado.anio, Estado.mes, d).getDay();
      html += `<th class="${day===0?'domingo':day===6?'sabado':''}">${d}</th>`;
    }
    html += "</tr></thead><tbody>";

    let idxGrupo = 0;
    for(const coord in grupos){
      const color = tonos[idxGrupo % tonos.length];
      html += `<tr style="background:${color};font-weight:bold;"><td colspan="${diasMes+2}">Coordinador: ${coord}</td></tr>`;
      grupos[coord].forEach(emp=>{
        html += `<tr style="background:${color};">`;
        html += `<td>${emp.legajo||''}</td><td style="text-align:left;padding-left:8px;">${emp.nombre||''}${emp.coordinador?'<br/><small style="color:#666">Coord: '+(emp.coordinador||'')+'</small>':''}</td>`;
        for(let d=1; d<=diasMes; d++){
          const f = new Date(Estado.anio, Estado.mes, d);
          const day = f.getDay();
          if(day===0 || day===6){ html += "<td class='no-trabaja'></td>"; continue; }
          const empIndex = Estado.empleados.indexOf(emp);
          const lic = Estado.licencias.find(l=>l.empleado===empIndex && isDateInRangeYMD(f,l.inicio,l.fin));
          if(lic){
            const t = Licencias.tipos[lic.tipo];
            html += `<td style="background:${t.color};color:#fff;font-weight:bold;">${t.letra}</td>`;
            continue;
          }
          const id = day-1;
          html += `<td class="${emp.checks[id]?'trabaja':'no-trabaja-h'}">${emp.checks[id]?'P':'H'}</td>`;
        }
        html += "</tr>";
      });
      idxGrupo++;
    }

    html += "</tbody></table>";
    cont.innerHTML = html;
    this.renderResumen();
  },

  renderResumen(){
    const r = document.getElementById("resumenTabla");
    const diasMes = new Date(Estado.anio, Estado.mes+1, 0).getDate();
    let html = "<h3>Resumen mensual</h3>";
    html += "<table><tr><th>Legajo</th><th>Empleado</th><th>P</th><th>H</th></tr>";
    Estado.empleados.forEach(emp=>{
      let P=0,H=0;
      for(let d=1; d<=diasMes; d++){
        const f = new Date(Estado.anio, Estado.mes, d);
        const day = f.getDay();
        if(day===0||day===6) continue;
        const id = day-1;
        if(emp.checks[id]) P++; else H++;
      }
      html += `<tr><td>${emp.legajo||''}</td><td style="text-align:left;padding-left:8px;">${emp.nombre||''}</td><td>${P}</td><td>${H}</td></tr>`;
    });
    html += "</table>";
    r.innerHTML = html;

    // charts
    const totalP = Estado.empleados.reduce((a,e)=>{
      const dias = new Date(Estado.anio,Estado.mes+1,0).getDate();
      return a + [...Array(dias).keys()].filter(d=>{
        const f=new Date(Estado.anio,Estado.mes,d+1);
        return f.getDay()>0 && f.getDay()<6 && e.checks[f.getDay()-1];
      }).length;
    },0);
    const totalH = Estado.empleados.reduce((a,e)=>{
      const dias = new Date(Estado.anio,Estado.mes+1,0).getDate();
      return a + [...Array(dias).keys()].filter(d=>{
        const f=new Date(Estado.anio,Estado.mes,d+1);
        return f.getDay()>0 && f.getDay()<6 && !e.checks[f.getDay()-1];
      }).length;
    },0);

    if(window.chartPH) chartPH.destroy();
    if(window.chartLic) chartLic.destroy();

    chartPH = new Chart(document.getElementById('graficoPH'), {
      type:'pie',
      data:{ labels:['Presencial','Homeoffice'], datasets:[{ data:[totalP,totalH] }]},
      options:{ plugins:{ legend:{ position:'bottom' } } }
    });

    const licCount = {};
    Licencias.tipos.forEach(t=>licCount[t.nombre]=0);
    Estado.licencias.forEach(l=>{ licCount[ Licencias.tipos[l.tipo].nombre ]++; });

    chartLic = new Chart(document.getElementById('graficoLicencias'), {
      type:'pie',
      data:{ labels:Object.keys(licCount), datasets:[{ data:Object.values(licCount) }]},
      options:{ plugins:{ legend:{ position:'bottom' } } }
    });
  },

  async exportarPDF(){
    const mes = Util.meses[Estado.mes];
    const titulo = `Asistencia – ${mes} ${Estado.anio}`;
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const usableW = pageW - margin*2;
    const usableH = pageH - margin*2 - 12;

    const tabla = document.getElementById('tabla-container');
    const canvas = await html2canvas(tabla, { scale: 2, backgroundColor:'#ffffff' });
    const imgW = canvas.width;
    const imgH = canvas.height;
    const pxPerMm = imgW / usableW;
    const sliceH = Math.floor(usableH * pxPerMm);

    let yPos = 0;
    let page = 0;
    while(yPos < imgH){
      const tmp = document.createElement('canvas');
      tmp.width = imgW;
      tmp.height = Math.min(sliceH, imgH - yPos);
      const ctx = tmp.getContext('2d');
      ctx.drawImage(canvas, 0, yPos, imgW, tmp.height, 0, 0, imgW, tmp.height);
      const imgData = tmp.toDataURL('image/png');

      if(page > 0) pdf.addPage();
      pdf.setFontSize(16);
      pdf.text(titulo + (page>0?' (cont.)':''), pageW/2, 12, { align:'center' });

      const imgProps = pdf.getImageProperties(imgData);
      const h_mm = (imgProps.height * usableW) / imgProps.width;
      pdf.addImage(imgData, 'PNG', margin, 18, usableW, h_mm);

      yPos += sliceH;
      page++;
    }

    pdf.addPage();
    pdf.setFontSize(16);
    pdf.text(`Resumen mensual – ${mes} ${Estado.anio}`, pageW/2, 12, { align:'center' });

    const resumen = document.getElementById('estadisticas-container');
    const canvas2 = await html2canvas(resumen, { scale:2, backgroundColor:'#ffffff' });
    const data2 = canvas2.toDataURL('image/png');
    const props2 = pdf.getImageProperties(data2);
    const h2 = (props2.height * usableW) / props2.width;
    pdf.addImage(data2, 'PNG', margin, 18, usableW, h2);

    pdf.save(`asistencia_${mes}_${Estado.anio}.pdf`);
  }
};

/* Export/Import JSON functions */
function exportarJSON(){
  const data = JSON.stringify(Estado, null, 2);
  const blob = new Blob([data], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'asistencia_respaldo.json'; a.click();
  URL.revokeObjectURL(url);
}

function importarJSON(input){
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    try{
      const obj = JSON.parse(e.target.result);
      Estado.empleados = obj.empleados || Estado.empleados;
      Estado.licencias = obj.licencias || Estado.licencias;
      Estado.mes = obj.mes ?? Estado.mes;
      Estado.anio = obj.anio ?? Estado.anio;
      guardarEstado();
      UI.fillCoordFilter();
      UI.renderTabla();
      alert('Importado correctamente');
    }catch(err){
      alert('Error importando JSON');
    }
  };
  reader.readAsText(file);
}
