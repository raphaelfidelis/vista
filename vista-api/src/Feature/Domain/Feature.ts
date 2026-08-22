export class Feature {
  private _id: string;
  private _name: string;
  private _description: string;
  private _icon: string | null;
  private _isActive: boolean;
  private _createdAt: Date;

  constructor(
    id: string,
    name: string,
    description: string,
    icon: string | null,
    isActive: boolean,
    createdAt: Date,
  ) {
    this._id = id;
    this._name = name;
    this._description = description;
    this._icon = icon;
    this._isActive = isActive;
    this._createdAt = createdAt;
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  set name(name: string) {
    this._name = name;
  }

  get description(): string {
    return this._description;
  }

  set description(description: string) {
    this._description = description;
  }

  get icon(): string | null {
    return this._icon;
  }

  set icon(icon: string | null) {
    this._icon = icon;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  set isActive(isActive: boolean) {
    this._isActive = isActive;
  }

  get createdAt(): Date {
    return this._createdAt;
  }
}
