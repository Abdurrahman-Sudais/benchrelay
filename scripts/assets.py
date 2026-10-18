from pathlib import Path
import cairosvg
p=Path('public/brand')
p.mkdir(parents=True,exist_ok=True)
def mark(color):
 return f'<g fill="none" stroke="{color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 17h28v11M28 43h28V32"/><path d="M18 25v18h17M46 35V17H29" stroke-width="3"/></g>'
for name,color in [('dark','#174E52'),('light','#F5F8F7')]:
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="360" height="72" viewBox="0 0 360 72"><title>Benchrelay</title><g transform="translate(0 5)">{mark(color)}</g><text x="77" y="49" fill="{color}" font-family="DejaVu Sans,sans-serif" font-size="37" letter-spacing="-1.8">Benchrelay</text></svg>'
 # Convert wordmark text to paths using font outlines so SVG stays editable and portable.
 from fontTools.ttLib import TTFont
 from fontTools.pens.svgPathPen import SVGPathPen
 font=TTFont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'); gs=font.getGlyphSet(); cmap=font.getBestCmap(); scale=37/font['head'].unitsPerEm; x=77; paths=[]
 for c in 'Benchrelay':
  glyph=gs[cmap[ord(c)]]; pen=SVGPathPen(gs); glyph.draw(pen)
  paths.append(f'<path d="{pen.getCommands()}" transform="translate({x} 49) scale({scale} {-scale})" fill="{color}"/>')
  x+=glyph.width*scale-1.8
 svg=svg[:svg.index('<text')]+''.join(paths)+'</svg>'
 (p/f'benchrelay-{name}.svg').write_text(svg)
 cairosvg.svg2png(bytestring=svg.encode(),write_to=str(p/f'benchrelay-{name}.png'),output_width=1440,output_height=288)
 symbol=f'<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><title>Benchrelay symbol</title>{mark(color)}</svg>'
 (p/('benchrelay-symbol.svg' if name=='dark' else 'benchrelay-symbol-light.svg')).write_text(symbol)
avatar=f'<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 128 128"><title>Benchrelay</title><rect width="128" height="128" rx="16" fill="#DDEDE6"/><g transform="translate(32 32)">{mark("#174E52")}</g></svg>'
(p/'benchrelay-avatar.svg').write_text(avatar)
cairosvg.svg2png(bytestring=avatar.encode(),write_to=str(p/'benchrelay-avatar.png'))
favicon=f'<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#174E52"/><g transform="translate(6 6) scale(.82)">{mark("#F5F8F7")}</g></svg>'
(p/'favicon.svg').write_text(favicon)
for size in [16,32,180]:
 cairosvg.svg2png(bytestring=favicon.encode(),write_to=str(p/('apple-touch-icon.png' if size==180 else f'favicon-{size}.png')),output_width=size,output_height=size)
social=f'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#DDEDE6"/><g transform="translate(80 65) scale(1.5)">{mark("#174E52")}</g><text x="195" y="142" font-family="DejaVu Sans" font-size="48" fill="#174E52">Benchrelay</text><text x="80" y="320" font-family="DejaVu Sans" font-size="58" fill="#243432">Before the method moves,</text><text x="80" y="398" font-family="DejaVu Sans" font-size="58" fill="#174E52">know what the next bench needs.</text><text x="80" y="535" font-family="DejaVu Sans" font-size="24" fill="#536861">METHOD-TRANSFER PREPARATION · EXPERT REVIEW</text></svg>'
(p/'social-preview.svg').write_text(social)
cairosvg.svg2png(bytestring=social.encode(),write_to=str(p/'social-preview.png'))
