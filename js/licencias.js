/* licencias.js - módulo Licencias */
const Licencias = {
  tipos:[
    {nombre:"Vacaciones",color:"#7cd67c",letra:"V"},
    {nombre:"Falta c/Aviso",color:"#ffcc00",letra:"FA"},
    {nombre:"Estudio",color:"#6699ff",letra:"LE"},
    {nombre:"Festividad",color:"#ff9966",letra:"LF"},
    {nombre:"Médica",color:"#cc6666",letra:"LM"},
    {nombre:"Baja",color:"#999999",letra:"B"},
    {nombre:"Matrimonio",color:"#cc99ff",letra:"LMA"},
    {nombre:"Paternidad",color:"#99cc99",letra:"LP"},
    {nombre:"Compensación Presencia", color:"#60b9ff", letra:"CP"},
    {nombre:"Cambio Home", color:"#ddddee", letra:"CH"}
  ],

  open(){ document.getElementById('licenciasModal').setAttribute('aria-hidden','false'); this.render(); },
  close(){ document.getElementById('licenciasModal').setAttribute('aria-hidden','true'); },

  guardar(){
    const emp = parseInt(document.getElementById("licEmpleado").value);
    const tipo = parseInt(document.getElementById("licTipo").value);
    const inicio = document.getElementById("licInicio").value;
    const fin = document.getElementById("licFin").value;
    if(!inicio||!fin) return alert("Indique inicio y fin");
    Estado.licencias.push({ empleado:emp, tipo, inicio, fin });
    guardarEstado(); this.render(); UI.renderTabla();
  },

  eliminar(i){
    if(!confirm('Eliminar licencia?')) return;
    Estado.licencias.splice(i,1);
    guardarEstado(); this.render(); UI.renderTabla();
  },

  renderLista(){
    const cont = document.getElementById("licenciasLista");
    const empSel = parseInt(document.getElementById("licEmpleado").value);
    const lista = Estado.licencias.filter(l=>l.empleado===empSel);
    if(lista.length===0){ cont.innerHTML="<i>Sin licencias</i>"; return; }
    cont.innerHTML = lista.map(l=>{
      const e = Estado.empleados[l.empleado]?.nombre || 'N/A';
      const t = this.tipos[l.tipo];
      return `
        <div style="margin-bottom:5px;padding:6px;background:#eee;border-radius:5px;">
          <b>${e}</b> — ${t.nombre} (${l.inicio} → ${l.fin})
          <button onclick="Licencias.eliminar(${Estado.licencias.indexOf(l)})" style="float:right;">🗑️</button>
        </div>
      `;
    }).join('');
  },

  render(){
    const c = document.getElementById("licenciasContent");
    const empOpts = Estado.empleados.map((e,i)=>`<option value="${i}">${e.nombre}</option>`).join('');
    c.innerHTML=`
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;margin-bottom:8px;">
        <div>
          <label>Empleado</label><br>
          <select id="licEmpleado" onchange="Licencias.renderLista()">
            ${empOpts}
          </select>
        </div>

        <div>
          <label>Tipo</label><br>
          <select id="licTipo">
            ${Licencias.tipos.map((t,i)=>`<option value="${i}">${t.nombre}</option>`).join('')}
          </select>
        </div>

        <div><label>Inicio</label><br><input type="date" id="licInicio"></div>
        <div><label>Fin</label><br><input type="date" id="licFin"></div>
      </div>

      <hr>
      <div id="licenciasLista"></div>
    `;
    this.renderLista();
  }
};
