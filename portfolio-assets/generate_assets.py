from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT = Path('portfolio-assets')
OUT.mkdir(exist_ok=True)

W, H = 1600, 900
BG = '#07111f'
TOP = '#0c1a31'
BOTTOM = '#091426'
PANEL = '#0f1d36'
PANEL2 = '#122548'
TEXT = '#f4f7ff'
MUTED = '#9fb2d9'
CYAN = '#35d0ff'
PURPLE = '#8b7cff'
GREEN = '#41e3a6'
YELLOW = '#ffd166'
PINK = '#ff76b7'
ORANGE = '#ff9f68'
BORDER = '#27436f'
DARK = '#08101f'

BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

def font(size, bold=False):
    return ImageFont.truetype(BOLD if bold else REG, size)

H1 = font(54, True)
H2 = font(34, True)
H3 = font(24, True)
BODY = font(22)
SMALL = font(18)
TINY = font(15)


def canvas(w=W, h=H):
    im = Image.new('RGB', (w, h), BG)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, w, 220), fill=TOP)
    d.rectangle((0, h - 170, w, h), fill=BOTTOM)
    return im, d


def rr(d, box, fill, outline=BORDER, width=2, r=24):
    d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)


def text_block(d, x, y, text, fnt, fill, max_width, line_gap=8):
    words = text.split()
    lines = []
    current = ''
    for word in words:
        trial = word if not current else current + ' ' + word
        if d.textbbox((0, 0), trial, font=fnt)[2] <= max_width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    cy = y
    for line in lines:
        d.text((x, cy), line, font=fnt, fill=fill)
        cy += (d.textbbox((0, 0), line, font=fnt)[3] - d.textbbox((0, 0), line, font=fnt)[1]) + line_gap
    return cy


def fit_text(d, x, y, text, sizes, fill, max_width, line_gap=6):
    for size in sizes:
        fnt = font(size)
        words = text.split()
        lines = []
        current = ''
        ok = True
        for word in words:
            trial = word if not current else current + ' ' + word
            if d.textbbox((0, 0), trial, font=fnt)[2] <= max_width:
                current = trial
            else:
                if current:
                    lines.append(current)
                current = word
                if d.textbbox((0, 0), word, font=fnt)[2] > max_width:
                    ok = False
                    break
        if current:
            lines.append(current)
        if ok:
            cy = y
            for line in lines:
                d.text((x, cy), line, font=fnt, fill=fill)
                cy += (d.textbbox((0, 0), line, font=fnt)[3] - d.textbbox((0, 0), line, font=fnt)[1]) + line_gap
            return cy
    return text_block(d, x, y, text, font(sizes[-1]), fill, max_width, line_gap)


def title(d, heading, subtitle):
    d.text((90, 68), heading, font=H1, fill=TEXT)
    text_block(d, 90, 142, subtitle, BODY, MUTED, 1380)


def bullets(d, x, y, items, width, color=CYAN, gap=12, fnt=BODY):
    cy = y
    for item in items:
        d.ellipse((x, cy + 8, x + 12, cy + 20), fill=color)
        cy = text_block(d, x + 24, cy, item, fnt, TEXT, width, 6) + gap
    return cy


def chip(d, x, y, label, fill, fg=DARK):
    bb = d.textbbox((0, 0), label, font=SMALL)
    w = bb[2] - bb[0] + 28
    h = 38
    rr(d, (x, y, x + w, y + h), fill=fill, outline=fill, width=1, r=18)
    d.text((x + 14, y + 8), label, font=SMALL, fill=fg)
    return w


def footer(d, text='ashishssoni / InsightFlow • AI SaaS backend showcase'):
    d.line((90, H - 82, W - 90, H - 82), fill=BORDER, width=2)
    d.text((90, H - 58), text, font=SMALL, fill=MUTED)

# 0 thumbnail, crop-safe and distinct from launchkit
thumb_w, thumb_h = 1280, 720
thumb = Image.new('RGB', (thumb_w, thumb_h), BG)
td = ImageDraw.Draw(thumb)
td.rectangle((0, 0, thumb_w, thumb_h), fill=BG)
td.rectangle((0, 0, thumb_w, 180), fill=TOP)
td.rectangle((0, 560, thumb_w, thumb_h), fill=BOTTOM)
center_x = thumb_w // 2

title_txt = 'InsightFlow'
sub_txt = 'AI SaaS Backend'
main_bb = td.textbbox((0, 0), title_txt, font=font(74, True))
sub_bb = td.textbbox((0, 0), sub_txt, font=font(40, True))
td.text((center_x - (main_bb[2]-main_bb[0])/2, 74), title_txt, font=font(74, True), fill=TEXT)
td.text((center_x - (sub_bb[2]-sub_bb[0])/2, 165), sub_txt, font=font(40, True), fill=CYAN)

rr(td, (180, 255, 1100, 505), PANEL, outline=BORDER, width=2, r=30)
rr(td, (485, 278, 795, 352), PURPLE, outline=PURPLE, width=1, r=20)
pill = 'ASYNC AI WORKFLOWS'
pill_font = font(22, True)
pill_bb = td.textbbox((0, 0), pill, font=pill_font)
td.text((640 - (pill_bb[2]-pill_bb[0])/2, 304), pill, font=pill_font, fill=DARK)

boxes = [
    (250, 392, 430, 458, '#d8f5ff', 'Queues'),
    (550, 392, 730, 458, '#d9ffe8', 'Usage'),
    (850, 392, 1030, 458, '#efe3ff', '2 DBs'),
]
for x1,y1,x2,y2,color,label in boxes:
    rr(td, (x1,y1,x2,y2), color, outline=color, width=1, r=18)
    f = font(24, True)
    bb = td.textbbox((0,0), label, font=f)
    td.text((x1 + ((x2-x1)-(bb[2]-bb[0]))/2, y1 + ((y2-y1)-(bb[3]-bb[1]))/2 - 2), label, font=f, fill=DARK)
for coords in [((640,348),(340,392)), ((640,348),(640,392)), ((640,348),(940,392))]:
    td.line((coords[0][0], coords[0][1], coords[1][0], coords[1][1]), fill=CYAN, width=5)

chips = [('NestJS', PINK), ('PostgreSQL', CYAN), ('MongoDB', GREEN), ('Redis', YELLOW), ('BullMQ', ORANGE)]
chip_ws = []
for t,c in chips:
    bb = td.textbbox((0,0), t, font=SMALL)
    chip_ws.append((bb[2]-bb[0])+28)
total = sum(chip_ws) + 16*(len(chip_ws)-1)
x = center_x - total/2
for (t,c),w in zip(chips, chip_ws):
    chip(td, x, 615, t, c, DARK)
    x += w + 16
thumb.save(OUT / '00-insightflow-thumbnail.png')

# 1 architecture
im, d = canvas()
title(d, 'InsightFlow Architecture', 'Modern AI product backend with async workflows, dual-database storage, usage metering, and queue-driven processing')
rr(d, (610, 250, 980, 355), CYAN, outline=CYAN, width=1)
bb = d.textbbox((0,0), 'InsightFlow API', font=H2)
d.text((610 + ((980-610)-(bb[2]-bb[0]))/2, 280), 'InsightFlow API', font=H2, fill=DARK)
sub = 'NestJS + Fastify + Swagger'
sb = d.textbbox((0,0), sub, font=SMALL)
d.text((610 + ((980-610)-(sb[2]-sb[0]))/2, 320), sub, font=SMALL, fill=DARK)

mods = [
    ('Auth', 'JWT + session flows', (100, 255), PINK),
    ('Documents', 'AI ingestion foundation', (100, 410), CYAN),
    ('AI Jobs', 'Queue + workflow orchestration', (100, 565), PURPLE),
    ('Usage', 'Metering + quota views', (1130, 255), GREEN),
    ('Workspaces', 'Tenancy + membership', (1130, 410), YELLOW),
    ('Outputs', 'Logs + workflow detail', (1130, 565), ORANGE),
]
for name, subtxt, (x,y), bar in mods:
    rr(d, (x,y,x+300,y+100), PANEL)
    d.rectangle((x,y,x+12,y+100), fill=bar)
    d.text((x+26,y+20), name, font=H3, fill=TEXT)
    fit_text(d, x+26, y+56, subtxt, [18,17,16], MUTED, 240, 4)
    if x < 610:
        d.line((x+300, y+50, 610, 302), fill=CYAN, width=3)
    else:
        d.line((x, y+50, 980, 302), fill=CYAN, width=3)
rr(d, (455, 445, 655, 575), PANEL2)
rr(d, (680, 445, 880, 575), PANEL2)
rr(d, (905, 445, 1085, 575), PANEL2)
pg_bb = d.textbbox((0,0), 'PostgreSQL', font=H3)
d.text((555 - (pg_bb[2]-pg_bb[0])/2, 478), 'PostgreSQL', font=H3, fill=TEXT)
fit_text(d, 490, 518, 'Users • Workspaces • Usage', [15,14,13], MUTED, 130, 4)
mg_bb = d.textbbox((0,0), 'MongoDB', font=H3)
d.text((780 - (mg_bb[2]-mg_bb[0])/2, 478), 'MongoDB', font=H3, fill=TEXT)
fit_text(d, 715, 518, 'Documents • Runs • Outputs • Logs', [15,14,13], MUTED, 130, 4)
rd_bb = d.textbbox((0,0), 'Redis + BullMQ', font=font(21, True))
d.text((995 - (rd_bb[2]-rd_bb[0])/2, 480), 'Redis + BullMQ', font=font(21, True), fill=TEXT)
fit_text(d, 933, 518, 'Async processing backbone', [14,13,12], MUTED, 124, 4)
footer(d)
im.save(OUT / '01-insightflow-architecture.png')

# 2 dual db highlight
im, d = canvas()
title(d, 'Dual-Database Design', 'Relational business data in PostgreSQL and flexible AI workflow payloads in MongoDB')
rr(d, (110, 230, 710, 660), PANEL)
rr(d, (890, 230, 1490, 660), PANEL)
d.text((145, 265), 'PostgreSQL', font=H2, fill=CYAN)
bullets(d, 150, 335, [
    'Users',
    'Organizations / Workspaces',
    'Billing-ready usage records',
    'Usage events',
], 420, color=CYAN, fnt=font(26, True))
d.text((925, 265), 'MongoDB', font=H2, fill=GREEN)
bullets(d, 930, 335, [
    'Workflow Runs',
    'AI Outputs',
    'Documents',
    'Embeddings Metadata',
    'Execution Logs',
], 420, color=GREEN, fnt=font(26, True))
rr(d, (500, 690, 1100, 775), PANEL2)
fit_text(d, 535, 716, 'Why it matters: structured business data stays relational while AI payloads remain flexible and iteration-friendly.', [17,16,15], TEXT, 530, 4)
footer(d, 'ashishssoni / InsightFlow • dual-database architecture visual')
im.save(OUT / '02-insightflow-dual-db.png')

# 3 async workflow pipeline
im, d = canvas()
title(d, 'Async AI Workflow Pipeline', 'Queue-backed processing flow for summarization, extraction, logging, outputs, and usage metering')
steps = [
    ('1. Upload / create document', 'Document stored for workspace'),
    ('2. Queue AI job', 'Workflow run created with QUEUED status'),
    ('3. Worker processes', 'Redis + BullMQ dispatch job'),
    ('4. AI output saved', 'Summary / insights / extraction payload'),
    ('5. Usage metered', 'Tokens + workflow events recorded'),
]
box_w = 255
x = 75
for i,(head,sub) in enumerate(steps):
    rr(d, (x, 360, x+box_w, 545), PANEL if i % 2 == 0 else PANEL2)
    fit_text(d, x+18, 392, head, [22,20,18], TEXT, box_w-36, 4)
    fit_text(d, x+18, 452, sub, [18,17,16], MUTED, box_w-36, 4)
    if i < len(steps)-1:
        mid = 452
        d.line((x+box_w+10, mid, x+box_w+32, mid), fill=CYAN, width=5)
        d.polygon([(x+box_w+32, mid), (x+box_w+18, mid-8), (x+box_w+18, mid+8)], fill=CYAN)
    x += 305
rr(d, (400, 620, 1200, 740), PANEL)
fit_text(d, 440, 655, 'Outcome: long-running AI work moves off the request thread while preserving outputs, logs, status transitions, and billing-friendly metering.', [18,17,16], TEXT, 720, 4)
footer(d, 'ashishssoni / InsightFlow • async processing showcase')
im.save(OUT / '03-insightflow-async-pipeline.png')

# 4 usage metering
im, d = canvas()
title(d, 'Usage Metering and Workspace Visibility', 'A billing-ready usage layer for tokens, document activity, workflow runs, and quota awareness')
metrics = [
    ('TOKENS', 'AI consumption tracking', CYAN),
    ('DOCUMENTS', 'Ingestion activity events', GREEN),
    ('WORKFLOW RUNS', 'Async job accounting', PURPLE),
]
for idx,(name,subtxt,color) in enumerate(metrics):
    x = 110 + idx * 470
    rr(d, (x, 310, x+390, 500), PANEL)
    rr(d, (x+28, 340, x+200, 395), color, outline=color, width=1, r=18)
    fit_text(d, x+50, 355, name, [24,22,20], DARK, 130, 4)
    fit_text(d, x+30, 425, subtxt, [20,19,18], TEXT, 320, 4)
rr(d, (250, 590, 1350, 725), PANEL2)
fit_text(d, 290, 620, 'Soft limits by plan and aggregated usage totals make the backend easier to extend into billing, alerts, admin dashboards, and founder analytics.', [22,20,18], TEXT, 1020, 6)
footer(d, 'ashishssoni / InsightFlow • usage-metered AI SaaS backend')
im.save(OUT / '04-insightflow-usage-metering.png')

# 5 API preview
im, d = canvas()
title(d, 'API Surface Preview', 'Portfolio-facing view of the endpoints that make the AI SaaS backend feel product-ready')
rr(d, (80, 230, 1520, 760), '#0d152b')
rr(d, (105, 255, 1495, 315), '#15244a')
d.text((135, 274), 'InsightFlow API Docs', font=H2, fill=TEXT)
chip(d, 1200, 267, 'v1', CYAN, DARK)
chip(d, 1268, 267, 'Bearer Auth', GREEN, DARK)
rows = [
    ('POST', '/auth/register', '#49cc90'),
    ('POST', '/documents', '#49cc90'),
    ('POST', '/ai-jobs', '#49cc90'),
    ('GET', '/ai-jobs/{workspaceId}', '#61affe'),
    ('GET', '/ai-jobs/{workspaceId}/runs/{workflowRunId}', '#61affe'),
    ('POST', '/ai-jobs/{workspaceId}/runs/{workflowRunId}/retry', '#49cc90'),
    ('GET', '/usage/{workspaceId}/overview', '#61affe'),
    ('GET', '/workspaces', '#61affe'),
]
y = 340
for method, route, color in rows:
    rr(d, (115, y, 1480, y+48), PANEL)
    rr(d, (132, y+8, 230, y+38), color, outline=color, width=1, r=10)
    mb = d.textbbox((0,0), method, font=SMALL)
    d.text((181 - (mb[2]-mb[0])/2, y+12), method, font=SMALL, fill=DARK)
    d.text((255, y+12), route, font=SMALL, fill=TEXT)
    y += 56
footer(d, 'ashishssoni / InsightFlow • API showcase visual')
im.save(OUT / '05-insightflow-api-preview.png')

print('Generated InsightFlow portfolio assets in', OUT)
