export class Feature {
  private _id: string;
  private _name: string;
  private _description: string;
  private _isActive: boolean;
  private _createdAt: Date;

  constructor(
    id: string,
    name: string,
    description: string,
    isActive: boolean,
    createdAt: Date,
  ) {
    this._id = id;
    this._name = name;
    this._description = description;
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
