export interface ParsedCommand {
  command: string;
  args: string[];
  flags: Record<string, boolean>;
}

export const parseCommand = (input: string): ParsedCommand | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Split by spaces but respect quotes
  const parts = trimmed.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g);
  if (!parts) return null;

  const command = parts[0].toLowerCase();
  const args: string[] = [];
  const flags: Record<string, boolean> = {};

  for (let i = 1; i < parts.length; i++) {
    let part = parts[i];
    
    // Remove surrounding quotes if they exist
    if ((part.startsWith('"') && part.endsWith('"')) || (part.startsWith("'") && part.endsWith("'"))) {
      part = part.slice(1, -1);
    }

    if (part.startsWith('--')) {
      flags[part.slice(2)] = true;
    } else if (part.startsWith('-') && part.length > 1) {
      const chars = part.slice(1).split('');
      chars.forEach(c => { flags[c] = true; });
    } else {
      args.push(part);
    }
  }

  return { command, args, flags };
};
