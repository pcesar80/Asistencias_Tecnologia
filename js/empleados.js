/* empleados.js - módulo Settings */
const Settings = {
  open(){ document.getElementById('settingsModal').setAttribute('aria-hidden','false'); this.render(); },
  close(){ document.getElementById('settingsModal').setAttribute('aria-hidden','true'); },

  agregarEmpleado(){
    Estado.empleados.push({
      legajo:"", nombre:"Nuevo empleado", checks:[true,true,true,true,true], coordinador:""
    });
    guardarEstado(); this.render(); UI.renderTabla(); UI.fillCoordFilter();
  },

  eliminarEmpleado(i){
    if(!confirm('Eliminar empleado?')) return;
    Estado.empleados.splice(i,1);
    guardarEstado(); this.render(); UI.renderTabla(); UI.fillCoordFilter();
  },

  render(){
    const c = document.getElementById("settingsContent");
    c.innerHTML = Estado.empleados.map((emp,i)=>{
      // build options for coordinators dynamically
      const coordOptions = ['<option value="">(Ninguno)</option>'].concat(
        Estado.empleados.map(e=>`<option value="${e.nombre}" ${emp.coordinador===e.nombre?'selected':''}>${e.nombre}</option>`)
      ).join('');
      // build days checkboxes html
      const dias = ['L','M','M','J','V'];
      const diasHtml = dias.map((d, idx)=>`<label style="font-size:12px;">${d}<input type="checkbox" ${emp.checks[idx]?'checked':''} onchange="Estado.empleados[${i}].checks[${idx}]=this.checked;guardarEstado();UI.renderTabla();"></label>`).join('');
      return `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;padding:8px;background:white;border:1px solid #eee;border-radius:6px;">

        <input type="text" placeholder="Legajo" value="${emp.legajo||''}"
          style="width:70px;padding:4px;font-size:13px;"
          onchange="Estado.empleados[${i}].legajo=this.value;guardarEstado();UI.renderTabla();">

        <input type="text" value="${emp.nombre||''}"
          style="width:150px;padding:4px;font-size:13px;"
          onchange="Estado.empleados[${i}].nombre=this.value;guardarEstado();UI.renderTabla();">

        <div style="display:flex;flex-direction:column;">
          <span style="font-size:12px;margin-bottom:4px;">Días</span>
          <div style="display:flex;gap:6px;">
            ${diasHtml}
          </div>
        </div>

        <div style="display:flex;flex-direction:column;">
          <span style="font-size:12px;margin-bottom:4px;">Coordinador</span>
          <select style="padding:4px;min-width:140px;font-size:13px;"
            onchange="Estado.empleados[${i}].coordinador=this.value;guardarEstado();UI.renderTabla();UI.fillCoordFilter();">
            ${coordOptions}
          </select>
        </div>

        <button onclick="Settings.eliminarEmpleado(${i})" style="margin-left:auto;">🗑️</button>
      </div>
      `;
    }).join('');
  }
};
