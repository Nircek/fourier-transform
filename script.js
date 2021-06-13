// @ts-check
/** @type {Oscilloscope} */ var ss;
/** @type {Oscilloscope[]} */ var cs;
/** @type {number} */ var rate;
/** @type {number?} */ var raf;

class Oscilloscope {
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
     * @param {number[]} x
     * @param {string | CanvasGradient | CanvasPattern} s
     */
    render(x, s = "black") {
        this.ctx.strokeStyle = s;
        this.ctx.beginPath();
        const margin = 8;
        /** @param {number} e */
        const off = e => margin + (this.canvas.height / 2 - margin) * (1 - e);
        if (x.length)
            this.ctx.moveTo(0, off(x[0]));
        for (const [i, e] of x.entries())
            this.ctx.lineTo(i, off(e));
        this.ctx.stroke();
    }
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

function init() {
    var osc = document.getElementsByClassName("oscilloscope")[0];
    for (let i = 0; i < 3; ++i)
        osc.parentElement.appendChild(osc.cloneNode(true));
    let arr = [...document.getElementsByClassName("oscilloscope")];
    let sum = arr.splice(0, 1)[0];
    sum.getElementsByClassName("controls")[0].remove();
    cs = arr.map(e => new Oscilloscope(e));
    ss = new Oscilloscope(sum, cs);
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
function sin(f, a = 1, s = 0) {
    return Array.from(Array(rate), (_, i) => a * Math.sin(s * 2 * Math.PI + i * f));
};

/**
 * @param {number[][]} args
 */
function avg(...args) {
    return args[0].map((_, i) => args.map(e => e[i]).reduce((p, n) => p + n, 0) / args.length);
};

function animate() {
    let arr = [
        sin(.1, Math.sin(Date.now() / 1e3), Date.now() / 1e4),
        sin(.2 + .1 * Math.sin(Date.now() / 1e4), 1, Date.now() / 1e3),
        sin(1 / Math.PI, 1, Date.now() / 5e3)
    ];
    for (let [i, e] of [avg(...arr), ...arr].entries()){
        let c = [ss, ...cs][i];
        c.clear();
        c.render(e);
    }
    raf = requestAnimationFrame(animate);
}
window.addEventListener('load', init);
window.addEventListener('resize', refresh);
