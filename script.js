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
        return 1 - (y - this.margin) / (this.canvas.height / 2 - this.margin);
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
        this.adata = Array(rate);
        for (let t of "mousedown mouseup mouseleave mousemove".split(" "))
            this.canvas.addEventListener(t, this.event.bind(this));
        let clear = document.createElement("button");
        clear.innerText = "Clear";
        clear.onclick = this.clearData.bind(this);
        this.e.getElementsByClassName("controls")[0].appendChild(clear);
    }
    clearData() {
        this.adata = [];
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
        let x = ev.clientX - this.canvas.offsetLeft;
        let y = ev.clientY - this.canvas.offsetTop;
        if (this.adata.length < rate) this.adata.push(...Array(rate - this.adata.length));
        this.adata[x] = this.onset(y);
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
    refresh();
}

function refresh() {
    rate = ss.canvas.offsetWidth;
    for (let c of [ss, ...cs])
        c.canvas.width = rate;
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
