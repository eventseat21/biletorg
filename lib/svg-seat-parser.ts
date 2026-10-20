export function extractSVGBounds(svgContent: string): { width: number; height: number } {
  const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/i)
  if (viewBoxMatch?.[1]) {
    const values = viewBoxMatch[1].trim().split(/\s+/).map((v) => Number(v))
    if (values.length >= 4 && values.every((n) => Number.isFinite(n))) {
      return { width: values[2], height: values[3] }
    }
  }

  const widthMatch = svgContent.match(/width=["']([^"']+)["']/i)
  const heightMatch = svgContent.match(/height=["']([^"']+)["']/i)

  return {
    width: widthMatch ? parseFloat(widthMatch[1]) || 800 : 800,
    height: heightMatch ? parseFloat(heightMatch[1]) || 600 : 600,
  }
}
