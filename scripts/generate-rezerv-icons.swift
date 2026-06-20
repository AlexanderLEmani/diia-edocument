import AppKit
import CoreGraphics

let root = URL(fileURLWithPath: CommandLine.arguments[1])
let outDir = root.appendingPathComponent("rezerv/assets")
let sourcePng = outDir.appendingPathComponent("icon-source.png")
let sourceSvg = outDir.appendingPathComponent("icon-source.svg")
let bg = NSColor(red: 233.0 / 255.0, green: 230.0 / 255.0, blue: 217.0 / 255.0, alpha: 1.0)
let sizes = [180, 192, 512]

func loadSourceImage() -> NSImage? {
  if let png = NSImage(contentsOf: sourcePng) { return png }
  if let svg = NSImage(contentsOf: sourceSvg) { return svg }
  return nil
}

func drawGeneratedIcon(side: CGFloat) -> NSImage {
  let canvas = NSImage(size: NSSize(width: side, height: side))
  canvas.lockFocus()

  bg.setFill()
  NSBezierPath(rect: NSRect(x: 0, y: 0, width: side, height: side)).fill()

  let reserve = "Резерв"
  let reserveFont = NSFont.systemFont(ofSize: side * 0.19, weight: .bold)
  let plusFont = NSFont.systemFont(ofSize: side * 0.14, weight: .semibold)

  let reserveAttrs: [NSAttributedString.Key: Any] = [
    .font: reserveFont,
    .foregroundColor: NSColor.black,
  ]
  let plusAttrs: [NSAttributedString.Key: Any] = [
    .font: plusFont,
    .foregroundColor: NSColor(red: 0.96, green: 0.51, blue: 0.13, alpha: 1.0),
  ]

  let reserveSize = reserve.size(withAttributes: reserveAttrs)
  let plusSize = "+".size(withAttributes: plusAttrs)
  let gap = side * 0.02
  let totalWidth = reserveSize.width + gap + plusSize.width
  let startX = (side - totalWidth) / 2
  let baselineY = (side - max(reserveSize.height, plusSize.height)) / 2

  reserve.draw(
    at: NSPoint(x: startX, y: baselineY),
    withAttributes: reserveAttrs
  )
  "+".draw(
    at: NSPoint(x: startX + reserveSize.width + gap, y: baselineY + side * 0.01),
    withAttributes: plusAttrs
  )

  canvas.unlockFocus()
  return canvas
}

func exportPng(_ image: NSImage, to outURL: URL, side: CGFloat) throws {
  let radius = side * 0.2237
  let canvas = NSImage(size: NSSize(width: side, height: side))
  canvas.lockFocus()

  bg.setFill()
  NSBezierPath(rect: NSRect(x: 0, y: 0, width: side, height: side)).fill()

  let clip = NSBezierPath(
    roundedRect: NSRect(x: 0, y: 0, width: side, height: side),
    xRadius: radius,
    yRadius: radius
  )
  clip.addClip()

  image.draw(
    in: NSRect(x: 0, y: 0, width: side, height: side),
    from: NSRect(origin: .zero, size: image.size),
    operation: .sourceOver,
    fraction: 1
  )

  canvas.unlockFocus()

  guard
    let tiff = canvas.tiffRepresentation,
    let rep = NSBitmapImageRep(data: tiff),
    let png = rep.representation(using: .png, properties: [:])
  else {
    throw NSError(domain: "icon", code: 1)
  }

  try png.write(to: outURL)
}

let baseImage = loadSourceImage() ?? drawGeneratedIcon(side: 512)

try FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)

for size in sizes {
  let side = CGFloat(size)
  let outURL = outDir.appendingPathComponent("icon-\(size).png")
  try exportPng(baseImage, to: outURL, side: side)
  print("wrote \(outURL.path)")
}
