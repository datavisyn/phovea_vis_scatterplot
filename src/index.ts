/**
 * Created by Marc Streit on 06.08.2014.
 */

import Impl, {IScatterplotOptions as ImplOptions, scale} from 'datavisyn-scatterplot/src';
import {AVisInstance, IVisInstance, assignVis, IVisInstanceOptions} from 'phovea_core/src/vis';
import {mixin, onDOMNodeRemoved} from 'phovea_core/src';
import {IMatrix} from 'phovea_core/src/matrix';
import {Range, Range1D} from 'phovea_core/src/range';


export declare type NumberImplOptions = ImplOptions<[number, number]>;
declare type NumberImpl = Impl<[number, number]>;

export interface IScatterPlotOptions extends IVisInstanceOptions {
  xcol?: number;
  ycol?: number;

  impl?: NumberImplOptions;
}

interface INumberValue {
  type: string; //real, int
  range: [number, number];
}

function toRange(...cols: number[]) {
  return new Range([Range1D.all(), Range1D.from(cols)]);
}

export default class ScatterPlot extends AVisInstance implements IVisInstance {
  private options: IScatterPlotOptions = {
    scale: [1, 1],
    rotate: 0,
    xcol: 0,
    ycol: 1
  };

  readonly node: HTMLElement;
  private impl: NumberImpl;
  private loaded: [number, number][];


  constructor(public readonly data: IMatrix, parent: Element, options: IScatterPlotOptions = {}) {
    super();
    mixin(this.options, options);

    this.node = this.build(parent, options.impl);
    assignVis(this.node, this);
  }

  get rawSize(): [number, number] {
    return [300, 300];
  }

  private createImplOptions(options: NumberImplOptions, cols: string[]) {
    const value = <INumberValue>this.data.valuetype;
    const base: NumberImplOptions = {
      x: (row) => row[0],
      xlabel: cols[0],
      xscale: scale.scaleLinear().domain(value.range),
      y: (row) => row[1],
      ylabel: cols[1],
      yscale: scale.scaleLinear().domain(value.range),
      onSelectionChanged: this.onSelectionChanged.bind(this)
    };
    return mixin(base, options);
  }

  private onSelectionChanged() {
    const selection = this.impl.selection;
    const indices = selection.map((s) => this.loaded.indexOf(s));
    // select the two cells
    this.data.selectProduct([new Range([Range1D.from(indices), Range1D.single(this.options.xcol)]),
      new Range([Range1D.from(indices), Range1D.single(this.options.ycol)])]);
  }

  private onDataSelectionChanged(event: any, selected: Range) {
    const selection = selected.dim(0).filter(this.loaded);
    if (this.impl) {
      this.impl.selection = selection;
    }
  }

  private build(parent: Element, options: NumberImplOptions = {}) {
    const size = this.size,
      data = this.data;

    const width = size[0], height = size[1];

    const node = parent.ownerDocument.createElement('div');
    parent.appendChild(node);
    node.classList.add('phovea-vis-scatterplot');
    node.style.width = width + 'px';
    node.style.height = height + 'px';
    const selectedColumns: Range = toRange(this.options.xcol, this.options.ycol);

    Promise.all<any[]>([data.data(selectedColumns), data.cols(new Range([selectedColumns.dim(1)]))]).then(([rows, cols]: [[number, number][], string[]]) => {
      this.loaded = rows;
      this.impl = new Impl(rows, node, this.createImplOptions(options, cols));

      data.selections().then((selected: Range) => {
        this.onDataSelectionChanged(null, selected);
      });

      this.impl.render();

      this.markReady();
    });

    const listener = this.onDataSelectionChanged.bind(this);
    data.on('select-selected', listener);
    onDOMNodeRemoved(node, () => {
      data.off('select-selected', listener);
    });

    return node;
  }
}

export function create(data: IMatrix, parent: Element, options: IScatterPlotOptions = {}) {
  return new ScatterPlot(data, parent, options);
}
