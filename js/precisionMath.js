(function(){
    class BigNum {
        constructor(value=0){
            this.value = Number(value);
        }
        plus(v){ return new BigNum(this.value + Number(v instanceof BigNum ? v.value : v)); }
        minus(v){ return new BigNum(this.value - Number(v instanceof BigNum ? v.value : v)); }
        times(v){ return new BigNum(this.value * Number(v instanceof BigNum ? v.value : v)); }
        div(v){ return new BigNum(this.value / Number(v instanceof BigNum ? v.value : v)); }
        gt(v){ return this.value > Number(v instanceof BigNum ? v.value : v); }
        toString(){ return String(this.value); }
        valueOf(){ return this.value; }
    }

    function toBig(v){ return v instanceof BigNum ? v : new BigNum(v); }
    function add(...vals){ return vals.reduce((acc,v)=>acc.plus(v), new BigNum(0)); }
    function sub(a,b){ return toBig(a).minus(b); }
    function mul(a,b){ return toBig(a).times(b); }
    function div(a,b){ return toBig(a).div(b); }

    window.precisionMath = { toBig, add, sub, mul, div };
    window.math = {
        min:(a,b)=> toBig((toBig(a).value < toBig(b).value) ? a : b),
        max:(a,b)=> toBig((toBig(a).value > toBig(b).value) ? a : b),
        abs:(a)=> toBig(Math.abs(toBig(a).value))
    };
})();
