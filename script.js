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
        return this.e.getElementsByTagName("canvas")[0];
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
    set freq(x) {
        this.control("freq").value = x;
        this.control("auto-freq").checked = false;
    }
    set ampl(x) {
        this.control("ampl").value = x;
        this.control("auto-ampl").checked = false;
    }
    set shif(x) {
        this.control("shif").value = x;
        this.control("auto-shif").checked = false;
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
        let y = this.onset(ev.clientY - rect.top);
        if (y == null) return;
        if (x < this.start) {
            this.odata = [y, ...Array(this.start - x - 1), ...this.odata];
            this.start = x;
        } else if (this.start == -Infinity) {
            this.odata = [y];
            this.start = x;
        } else {
            if (this.start + this.odata.length <= x)
                this.odata = [...this.odata, ...Array(x - this.start - this.odata.length), y];
            else
                this.odata[x - this.start] = y;
        }
        let neu = /** @type {[number, number][]} */(Array(this.odata.length));
        let l = /** @type {[number, number]} */([NaN, NaN]); // x, y
        for (let i = neu.length - 1; i != -1; --i)
            l = neu[i] = this.odata[i] != null ? [i, this.odata[i]] : l;
        this.fodata = [...this.odata];
        for (let i = 0; i < this.odata.length - 1; ++i) { // last should be defined
            if (this.odata[i] != null) {
                if (this.odata[i + 1] == null)
                    l = [(this.odata[i] - neu[i + 1][1]) / (i - neu[i + 1][0]), this.odata[i] - (this.odata[i] - neu[i + 1][1]) / (i - neu[i + 1][0]) * i]; // a,b
            } else {
                this.fodata[i] = l[0] * i + l[1];
            }
        }
        const mod = (/** @type {number} */ a, /** @type {number} */ b) => ((a % b) + b) % b;
        this.adata = Array(rate).fill().map((_, i) => this.fodata[mod(i - this.start, this.fodata.length)]);
    }
}

class Fourier extends DrawObserver {
    /**
     * @param {Element} e
     * @param {Oscilloscope[]} sum
     */
    constructor(e, sum = undefined) {
        super(e, sum);
    }
    sinintegral(cos = false, n = 1) {
        const f = cos ? Math.cos : Math.sin;
        const ff = (/** @type {number} */ i) => this.fodata[i] * f(2 * n * Math.PI * i / this.fodata.length);
        if (this.fodata.length == 0) return 0;
        let s = (ff(0) + ff(this.fodata.length - 1)) / 2;
        for (let i = 1; i < this.fodata.length - 1; ++i) s += ff(i);
        return s;

    }
    /**
     * @param {MouseEvent} ev
     */
    event(ev) {
        DrawObserver.prototype.event.call(this, ev);
        if (!this.drawing) return;
        const xd = /** @type {[string, string, string][]} */([]);
        for (let i = 2; i < this.sum.length * 2 + 2; ++i) {
            const b = i % 2 == 1, c = 2 / this.fodata.length;
            const j = Math.floor(i / 2);
            const f = j * Math.PI * c;
            xd.push(usin(f, c * this.sinintegral(b, j), (b ? Math.PI / 2 : 0) - this.start * f));
        }
        xd.sort((a, b) => Math.abs(+b[1]) - Math.abs(+a[1]));
        for (let [i, o] of this.sum.entries())
            [o.freq, o.ampl, o.shif] = xd[i];
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
    ss = new Fourier(sum, cs);
    cs.forEach((e, i) => { e.freq = "" + (i + 1) * 1000; e.ampl = "" + 33; });
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
 * @param {number} f
 * @param {number} a
 * @param {number} s
 * @returns {[string, string, string]}
 */
function usin(f, a, s) {
    f /= 1e-4;
    a /= 1e-2;
    s /= Math.PI / 180;
    s %= 360;
    return ["" + f, "" + a, "" + s];
};

/**
 * @param {number[][]} args
 */
function avg(...args) {
    return args[0].map((_, i) => args.map(e => e[i]).reduce((p, n) => p + n, 0));// / args.length);
};

function animate() {
    for (let o of [...cs, ss])
        o.animate();
    raf = requestAnimationFrame(animate);
}
window.addEventListener("load", init);
window.addEventListener("resize", refresh);
