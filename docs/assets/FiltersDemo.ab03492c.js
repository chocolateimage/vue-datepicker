import{_ as l,f as d,g as p,u as c,j as i,r as m,o as u,c as f,b as _}from"./app.46c9efaa.js";import{Q as k,g as D,b as v}from"./vue-datepicker.es.9f3b8378.js";const y=d({components:{Datepicker:k},setup(){const e=p(new Date),t=c();return{filters:i(()=>{const r=new Date;return{months:Array.from(Array(3).keys()).map(a=>D(v(r,a+1)))}}),date:e,dark:t}}}),g={class:"demo-wrap"};function h(e,t,o,r,a,V){const s=m("Datepicker");return u(),f("div",g,[_(s,{modelValue:e.date,"onUpdate:modelValue":t[0]||(t[0]=n=>e.date=n),dark:e.dark,placeholder:"Select Date",filters:e.filters},null,8,["modelValue","dark","filters"])])}var F=l(y,[["render",h],["__file","FiltersDemo.vue"]]);export{F as default};
