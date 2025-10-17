export class RateLimiter {
  private hits = new Map<string, number[]>();
  
  constructor(private cfg: { max: number; windowMs: number }) {}
  
  allow(key: string) {
    const now = Date.now();
    const arr = (this.hits.get(key) ?? []).filter(t => now - t < this.cfg.windowMs);
    if (arr.length >= this.cfg.max) { 
      this.hits.set(key, arr); 
      return false; 
    }
    arr.push(now); 
    this.hits.set(key, arr); 
    return true;
  }
}
