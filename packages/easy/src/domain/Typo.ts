import { Exception, FetchOptions, Gateway, Id, Json, JsonValue, Key, List, PageList, Repository, toList, toPageList } from '../types';
import { when } from '../validation';
import { View } from '../utils';

export class Typo<T, Options = FetchOptions> extends Repository<T, Options> {
  constructor(protected view: View<T>, private readonly gateway: Gateway<Options>) {
    super();
  }

  create = (j: Json): T => this.view.from(j);

  all(options?: Options): Promise<PageList<T>> {
    return this.gateway.all(options).then(js => toPageList(js.map(j => this.create(j))));
  }

  byId(id: Id): Promise<T> {
    return this.gateway
      .byId(id)
      .then(j => when(j).not.isDefined.reject(Exception.DoesNotExist))
      .then(j => this.create(j));
  }

  byIds(...ids: Id[]): Promise<List<T>> {
    return this.gateway.byIds(...ids).then(js => toList(js.map(j => this.create(j))));
  }

  byKey(key: Key, options?: Options): Promise<PageList<T>> {
    return this.gateway.by('key', key, options).then(js => toPageList(js.map(j => this.create(j))));
  }

  by(key: keyof T, value: JsonValue, options?: Options): Promise<PageList<T>> {
    return this.gateway.by(key.toString(), value, options).then(js => toPageList(js.map(j => this.create(j))));
  }

  search(q: JsonValue, options?: Options): Promise<PageList<T>> {
    return this.gateway.search(q, options).then(js => toPageList(js.map(j => this.create(j))));
  }

  filter(options?: Options): Promise<PageList<T>> {
    return this.gateway.filter(options).then(js => toPageList(js.map(j => this.create(j))));
  }

  exists(id: Id): Promise<boolean> {
    return this.gateway.exists(id);
  }
}
