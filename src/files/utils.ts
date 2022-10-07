export type ParsedType = {
  type: string
  genericTypes?: ParsedType[]
}

export const extractTypeParameters = (type: string) =>
  parseTypeStr(type)?.genericTypes

export const parseTypeStr = (str: string) => {
  let cursor = 0
  const arr = str.split(/(, |[<>])/)
  const parentTypes: ParsedType[] = []
  while (cursor < arr.length) {
    const typeStr = arr[cursor++]
    const seperator = arr[cursor++]
    if (typeStr) {
      const type: ParsedType = { type: typeStr }
      if (parentTypes.length) {
        const parentType = parentTypes[parentTypes.length - 1]
        if (parentType.genericTypes) parentType.genericTypes.push(type)
        else parentType.genericTypes = [type]
      } else parentTypes.push(type)
      if (seperator === '<') parentTypes.push(type)
    }
    if (seperator === '>') parentTypes.pop()
  }
  if (parentTypes.length !== 1) return undefined
  return parentTypes[0]
}

export const typeToString = ({ type, genericTypes }: ParsedType): string => {
  if (!genericTypes?.length) return type
  return `${type}<${genericTypes.map(typeToString).join(', ')}>`
}

export const utilsFileContent = `export type ParsedType = {
  type: string
  genericTypes?: ParsedType[]
}

export const extractTypeParameters = (type: string) =>
  parseTypeStr(type)?.genericTypes

export const parseTypeStr = (str: string) => {
  let cursor = 0
  const arr = str.split(/(, |[<>])/)
  const parentTypes: ParsedType[] = []
  while (cursor < arr.length) {
    const typeStr = arr[cursor++]
    const seperator = arr[cursor++]
    if (typeStr) {
      const type: ParsedType = { type: typeStr }
      if (parentTypes.length) {
        const parentType = parentTypes[parentTypes.length - 1]
        if (parentType.genericTypes) parentType.genericTypes.push(type)
        else parentType.genericTypes = [type]
      } else parentTypes.push(type)
      if (seperator === '<') parentTypes.push(type)
    }
    if (seperator === '>') parentTypes.pop()
  }
  if (parentTypes.length !== 1) return undefined
  return parentTypes[0]
}

export const typeToString = ({ type, genericTypes }: ParsedType): string => {
  if (!genericTypes?.length) return type
  return \`\${type}<\${genericTypes.map(typeToString).join(', ')}>\`
}
`
