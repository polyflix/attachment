import { TriggerType } from "@polyflix/x-utils";
import { exposureMetadataKey } from "../decorators/expose.decorator";

export type PolyflixKafkaTypedValue<T> = {
  trigger: TriggerType;
  payload: T;
};

export class KafkaEventBuilder<T> {
  /**
   * Entity ID
   * @private
   */
  private readonly _id: string;
  /**
   * The whole entity & fields from entity
   * @private
   */
  private readonly _fields: Partial<T>;
  /**
   * What event / action did trigger this new event creation
   * @private
   */
  private _trigger?: TriggerType;

  /**
   * This getter use Reflect to get fields metadatas in order to
   * know whether they have been allowed to be exposed through @Expose()
   *
   * Reflect are great wtf
   * @private
   */
  private get fieldsExposed(): any[] {
    const fields = [];
    let target = Object.getPrototypeOf(this._fields);
    // Recursiveness
    while (target != Object.prototype) {
      const childFields =
        Reflect.getOwnMetadata(exposureMetadataKey, target) || [];
      fields.push(...childFields);
      target = Object.getPrototypeOf(target);
    }
    return fields;
  }

  /**
   * We just create a new object with only exposed fields
   */
  get fields(): unknown {
    const obj = {};
    const exposed = this.fieldsExposed;

    for (let i = 0; i < exposed.length; i++) {
      const objKey = exposed[i];
      if (objKey === undefined) continue;
      obj[objKey] = this._fields[objKey];
    }

    return obj;
  }

  constructor(id: string, source: Partial<T>) {
    this._fields = source;
    this._id = id;
    return this;
  }

  /**
   * Add a trigger property to the event
   * @param trigger
   */
  withTrigger(trigger: TriggerType): KafkaEventBuilder<T> {
    this._trigger = trigger;
    return this;
  }

  /**
   * Build the final structure to be sent
   */
  build(): Record<string, unknown> {
    const obj = {};
    if (this._trigger) {
      obj["trigger"] = this._trigger;
    }

    obj["id"] = this._id;
    obj["fields"] = this.fields;
    return obj;
  }
}
