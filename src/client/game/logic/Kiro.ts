export class Kiro {
  private currentWorld: "light" | "shadow" = "light";

  toggleWorld(): "light" | "shadow" {
    this.currentWorld = this.currentWorld === "light" ? "shadow" : "light";
    console.log(`[KIRO] Switched to ${this.currentWorld.toUpperCase()} WORLD`);
    return this.currentWorld;
  }

  getCurrentWorld(): "light" | "shadow" {
    return this.currentWorld;
  }

  log(world: "light" | "shadow", action: string, reflection: string) {
    console.log(`[${world.toUpperCase()} WORLD] ${action} → ${reflection}`);
  }
}
