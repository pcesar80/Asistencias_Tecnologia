/* estado.js - manejo de datos y persistencia */
const Estado = {
  empleados: [
    { legajo: "100", nombre:"Cesar Peña", checks:[true,true,true,true,true], coordinador:"" }
  ],
  mes: new Date().getMonth(),
  anio: new Date().getFullYear(),
  licencias: []
};

const Util = {
  diasSemana: ["L","M","M","J","V","S","D"],
  meses: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio",
          "Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
};

function isDateInRangeYMD(d, ini, fin){
  if(!ini||!fin) return false;
  const [y1,m1,d1] = ini.split("-").map(Number);
  const [y2,m2,d2] = fin.split("-").map(Number);
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return a >= new Date(y1,m1-1,d1) && a <= new Date(y2,m2-1,d2);
}

/* Persistencia localStorage */
function guardarEstado(){
  try{ localStorage.setItem("asistenciaEstado", JSON.stringify(Estado)); }catch(e){}
}
function cargarEstado(){
  try{
    const data = localStorage.getItem("asistenciaEstado");
    if(data){
      const obj = JSON.parse(data);
      Estado.empleados = obj.empleados || Estado.empleados;
      Estado.licencias = obj.licencias || Estado.licencias;
      Estado.mes = obj.mes ?? Estado.mes;
      Estado.anio = obj.anio ?? Estado.anio;
    }
  }catch(e){}
}
cargarEstado();
