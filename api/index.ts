import { testValue } from "./test";

export default function(req: any, res: any) {
  res.status(200).json({ testValue, time: new Date().toISOString() });
}
