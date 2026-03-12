export default function handler(req: any, res: any) {
  res.status(200).json({ 
    status: "alive-absolute-minimal", 
    time: new Date().toISOString() 
  });
}
