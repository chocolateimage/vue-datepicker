import{Q as l,a as t}from"./vue-datepicker.es.9f3b8378.js";import{_ as d,u as n,r as p,o as c,c as m,b as i}from"./app.46c9efaa.js";const k={components:{Datepicker:l},data(){return{date:new Date,dark:!0}},mounted(){this.dark=n()},computed:{markers(){return[{date:t(new Date,1),type:"dot",tooltip:[{text:"Dot with tooltip",color:"green"}]},{date:t(new Date,2),type:"line",tooltip:[{text:"First tooltip",color:"blue"},{text:"Second tooltip",color:"yellow"}]},{date:t(new Date,3),type:"dot",color:"yellow"}]}}},u={class:"demo-wrap"};function _(D,o,f,w,e,r){const a=p("Datepicker");return c(),m("div",u,[i(a,{modelValue:e.date,"onUpdate:modelValue":o[0]||(o[0]=s=>e.date=s),dark:e.dark,markers:r.markers},null,8,["modelValue","dark","markers"])])}var v=d(k,[["render",_],["__file","DemoMarkers.vue"]]);export{v as default};
