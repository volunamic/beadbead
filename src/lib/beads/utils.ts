export const areEqual = (obj1: Record<string, any>, obj2: Record<string, any>): boolean => {
  if (Object.keys(obj1).length !== Object.keys(obj2).length) return false

  return Object.entries(obj1).reduce(
    (acc, [key, value]) => (acc && key in obj2 && obj2[key] == value),
    true
  )
} 