import{_ as d,f as c,j as o,o as s,c as n,e as l,F as i,v as p,t as m}from"./app.46c9efaa.js";const f=c({emits:["update:hours","update:minutes"],props:{hoursIncrement:{type:[Number,String],default:1},minutesIncrement:{type:[Number,String],default:1},is24:{type:Boolean,default:!0},hoursGridIncrement:{type:[String,Number],default:1},minutesGridIncrement:{type:[String,Number],default:5},range:{type:Boolean,default:!1},filters:{type:Object,default:()=>({})},minTime:{type:Object,default:()=>({})},maxTime:{type:Object,default:()=>({})},timePicker:{type:Boolean,default:!1},hours:{type:[Number,Array],default:0},minutes:{type:[Number,Array],default:0}},setup(){const r=o(()=>{const a=[];for(let e=0;e<24;e++)a.push({text:e<10?`0${e}`:e,value:e});return a}),u=o(()=>{const a=[];for(let e=0;e<60;e++)a.push({text:e<10?`0${e}`:e,value:e});return a});return{hoursArray:r,minutesArray:u}}}),v={class:"custom-time-picker-component"},y=["value"],_=["value"],g=["value"],h=["value"];function b(r,u,a,e,k,$){return s(),n("div",v,[l("select",{class:"select-input",value:r.hours,onChange:u[0]||(u[0]=t=>r.$emit("update:hours",+t.target.value))},[(s(!0),n(i,null,p(r.hoursArray,t=>(s(),n("option",{key:t.value,value:t.value},m(t.text),9,_))),128))],40,y),l("select",{class:"select-input",value:r.minutes,onChange:u[1]||(u[1]=t=>r.$emit("update:minutes",+t.target.value))},[(s(!0),n(i,null,p(r.minutesArray,t=>(s(),n("option",{key:t.value,value:t.value},m(t.text),9,h))),128))],40,g)])}var A=d(f,[["render",b],["__file","TimePickerCmp.vue"]]);export{A as default};
