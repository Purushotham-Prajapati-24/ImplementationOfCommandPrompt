export const normalizePath = (cwd: string, target: string): string => {
  if (!target) return cwd;
  
  // Determine if target is absolute
  const currentPathStr = target.startsWith('/') ? target : `${cwd}/${target}`;
  
  // Split by '/' and remove empty parts and current dir ('.')
  const parts = currentPathStr.split('/').filter(p => p !== '' && p !== '.');
  const resolved: string[] = [];
  
  for (const part of parts) {
    if (part === '..') {
      if (resolved.length > 0) resolved.pop();
    } else {
      resolved.push(part);
    }
  }
  
  return '/' + resolved.join('/');
};

export const getParentPath = (path: string): { parentPath: string, targetName: string } => {
  if (path === '/') return { parentPath: '/', targetName: '' };
  
  const parts = path.split('/').filter(Boolean);
  const targetName = parts.pop() || '';
  const parentPath = '/' + parts.join('/');
  
  return { parentPath, targetName };
};
