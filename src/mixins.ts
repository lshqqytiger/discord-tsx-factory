export interface Listenable {
  readonly once?: boolean;
}
export abstract class ComponentLike<P, S> {
  public readonly props: P;
  public state: S;
  public constructor(props: Readonly<P> | P) {
    this.props = props;
    this.state = {} as S;
  }
  public componentDidMount?(): void | Promise<void>;
  public componentDidUpdate?(prevState: Readonly<S>): void | Promise<void>;
  public componentWillUnmount?(): void;
  public componentDidCatch?(error: any): void;
  public shouldComponentUpdate(nextState: Readonly<S>): boolean {
    return true;
  }
  public abstract render(): JSX.Element;
  public abstract setState: Function;
  public abstract forceUpdate(): void;
}
