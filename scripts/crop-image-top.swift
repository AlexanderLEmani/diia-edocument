import AppKit
import CoreGraphics
import ImageIO

let path = CommandLine.arguments[1]
let topCrop = Int(CommandLine.arguments.count > 2 ? (Int(CommandLine.arguments[2]) ?? 10) : 10)
let url = URL(fileURLWithPath: path)

guard
  let source = CGImageSourceCreateWithURL(url as CFURL, nil),
  let cgImage = CGImageSourceCreateImageAtIndex(source, 0, nil)
else {
  fputs("Failed to load image\n", stderr)
  exit(1)
}

let w = cgImage.width
let h = cgImage.height
let newH = h - topCrop

guard newH > 0, let cropped = cgImage.cropping(to: CGRect(x: 0, y: topCrop, width: w, height: newH)) else {
  fputs("Failed to crop image\n", stderr)
  exit(1)
}

let dest = CGImageDestinationCreateWithURL(url as CFURL, kUTTypePNG, 1, nil)!
CGImageDestinationAddImage(dest, cropped, nil)
guard CGImageDestinationFinalize(dest) else {
  fputs("Failed to write image\n", stderr)
  exit(1)
}

print("cropped top \(topCrop)px -> \(w)x\(newH)")
