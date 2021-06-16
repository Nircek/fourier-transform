// @ts-check
/** @type {Oscilloscope} */ var ss;
/** @type {Oscilloscope[]} */ var cs;
/** @type {number} */ var rate;
/** @type {number?} */ var raf;

class Oscilloscope {
    data = /** @type {number[]} */([]);
    adata = /** @type {number[]} */([]);
    /**
     * @param {Element} e
     * @param {Oscilloscope[]?} sum
     */
    constructor(e, sum = undefined) {
        this.e = e;
        this.sum = sum;
        this.r = Math.random();
    }
    get canvas() {
        return this.e.getElementsByTagName('canvas')[0];
    }
    get ctx() {
        return this.canvas.getContext("2d");
    }
    /**
     * @param {string} str
     */
    control(str) {
        return /** @type {HTMLInputElement} */(this.e.getElementsByClassName(str)[0]);
    }
    /**
     * @param {"freq"|"ampl"|"shif"} str
     */
    value(str) {
        return this.control(str).value;
    }
    /**
     * @param {"freq"|"ampl"|"shif"} str
     */
    auto(str) {
        return this.control("auto-" + str).checked;
    }
    get freq() {
        return this.value("freq");
    }
    get ampl() {
        return this.value("ampl");
    }
    get shif() {
        return this.value("shif");
    }
    margin = 8;
    /** @param {number} x */
    offset(x) {
        return this.margin + (this.canvas.height / 2 - this.margin) * (1 - x);
    }
    /** @param {number} y */
    onset(y) {
        if (y < this.margin || y > this.canvas.height - this.margin) return undefined;
        return (this.canvas.height - 2 * y) / (this.canvas.height - 2 * this.margin);
    }
    /**
     * @param {number[]} x
     * @param {string | CanvasGradient | CanvasPattern} s
     */
    render(x, s = "black") {
        this.ctx.strokeStyle = s;
        this.ctx.beginPath();
        for (const [i, e] of x.entries())
            this.ctx.lineTo(i, this.offset(e));
        this.ctx.stroke();
    }
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    animate() {
        this.clear();
        if (this.sum === undefined) {
            this.data = sin(+this.freq, +this.ampl, +this.shif);
            this.render(this.data);
        } else {
            let primary = "black", secondary = "red";
            if (this.adata.length) {
                this.render(this.adata, primary);
                primary = secondary;
            }
            this.render(avg(...this.sum.map(e => e.data)), primary);
        }

    }
}


class DrawObserver extends Oscilloscope {
    drawing = false;
    /**
     * @param {Element} e
     * @param {Oscilloscope[]} sum
     */
    constructor(e, sum = undefined) {
        super(e, sum);
        this.clearData();
        for (let t of "mousedown mouseup mouseleave mousemove".split(" "))
            this.canvas.addEventListener(t, this.event.bind(this));
        let clear = document.createElement("button");
        clear.innerText = "Clear";
        clear.onclick = this.clearData.bind(this);
        this.e.getElementsByClassName("controls")[0].appendChild(clear);
    }
    clearData() {
        this.adata = Array(rate);
        this.start = -Infinity;
        this.odata = /** @type {number[]} */([]);
        this.fodata = /** @type {number[]} */([]);
    }
    /**
     * @param {MouseEvent} ev
     */
    event(ev) {
        switch (ev.type) {
            case "mousedown": this.drawing = true; break;
            case "mouseup": this.drawing = false; break;
            case "mouseleave": this.drawing = false; break;
        }
        if (!this.drawing) return;
        let rect = this.canvas.getBoundingClientRect();
        let x = ev.clientX - rect.left;
        let y = ev.clientY - rect.top;
        console.log(this.start, this.odata, x);
        if (x < this.start) {
            this.odata = [this.onset(y), ...Array(this.start - x - 1), ...this.odata];
            this.start = x;
        } else if (this.start == -Infinity) {
            this.odata = [this.onset(y)];
            this.start = x;
        } else {
            if (this.start + this.odata.length <= x)
                this.odata = [...this.odata, ...Array(x - this.start - this.odata.length), this.onset(y)];
            else
                this.odata[x - this.start] = this.onset(y);
        }
        let neu = /** @type {[number, number][]} */(Array(this.odata.length));
        let l = /** @type {[number, number]} */([NaN, NaN]); // x, y
        for (let i = neu.length - 1; i != -1; --i)
            l = neu[i] = this.odata[i] != null ? [i, this.odata[i]] : l;
        this.fodata = [...this.odata]
        for (let i = 0; i < this.odata.length - 1; ++i) { // last should be defined
            if (this.odata[i] != null && this.odata[i + 1] == null)
                l = [(this.odata[i] - neu[i + 1][1]) / (i - neu[i + 1][0]), this.odata[i] - (this.odata[i] - neu[i + 1][1]) / (i - neu[i + 1][0]) * i]; // a,b
            else this.fodata[i] = l[0] * i + l[1];
        }
        const mod = (/** @type {number} */ a, /** @type {number} */ b) => ((a % b) + b) % b;
        console.log(this.fodata);
        this.adata = Array(rate).fill().map((_, i) => this.fodata[mod(i - this.start, this.fodata.length)]);
    }
}

function init() {
    var osc = document.getElementsByClassName("oscilloscope")[0];
    for (let i = 0; i < 3; ++i)
        osc.parentElement.appendChild(osc.cloneNode(true));
    let arr = [...document.getElementsByClassName("oscilloscope")];
    let sum = arr.splice(0, 1)[0];
    sum.getElementsByClassName("controls")[0].innerHTML = "";
    cs = arr.map(e => new Oscilloscope(e));
    ss = new DrawObserver(sum, cs);
    cs.forEach((e, i) => { e.control("freq").value = "" + (i + 1) * 1000 });
    refresh();
}

function refresh() {
    let H;
    [rate, H] = [ss.canvas.offsetWidth, ss.canvas.offsetHeight];
    for (let c of [ss, ...cs])
        [c.canvas.width, c.canvas.height] = [rate, H];
    if (raf !== undefined)
        cancelAnimationFrame(raf);
    raf = requestAnimationFrame(animate);
}


/**
 * @param {number} f
 */
function sin(f, a = 100, s = 360) {
    f *= 1e-4;
    a *= 1e-2;
    s *= Math.PI / 180;
    return Array.from(Array(rate), (_, i) => a * Math.sin(s + i * f));
};

/**
 * @param {number[][]} args
 */
function avg(...args) {
    return args[0].map((_, i) => args.map(e => e[i]).reduce((p, n) => p + n, 0) / args.length);
};

function animate() {
    for (let o of [...cs, ss])
        o.animate();
    raf = requestAnimationFrame(animate);
}
window.addEventListener('load', init);
window.addEventListener('resize', refresh);
