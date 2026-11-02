import { ObjectId } from "mongodb";

export function isObjectId(value) {
  return typeof value === "string" && ObjectId.isValid(value) && new ObjectId(value).toHexString() === value;
}
