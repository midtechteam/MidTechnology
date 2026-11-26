from __future__ import annotations

import json
from typing import Any

# ---------------------------------------------------------------------------
# Prompt / text export helpers
# ---------------------------------------------------------------------------


def _element_summary(element: dict) -> str:
    """Return a one-line human-readable summary of a design element."""
    el_type = element.get("type", "unknown")
    name = element.get("name", "")
    x = element.get("x", 0)
    y = element.get("y", 0)
    w = element.get("width", 0)
    h = element.get("height", 0)
    extra = ""

    if el_type == "text":
        content = element.get("content", "")[:60]
        extra = f', text="{content}"'
    elif el_type in ("rectangle", "ellipse"):
        fill = element.get("fill", "")
        extra = f", fill={fill}"
    elif el_type == "image":
        src = element.get("src", "")[:40]
        extra = f", src={src}"

    return f"  - [{el_type}] {name!r} at ({x}, {y}) size {w}x{h}{extra}"


def _artboard_summary(artboard: dict, format: str = "txt") -> str:
    """Format one artboard for prompt output."""
    name = artboard.get("name", "Artboard")
    w = artboard.get("width", 0)
    h = artboard.get("height", 0)
    bg = artboard.get("backgroundColor", "#FFFFFF")
    elements: list[dict] = artboard.get("elements", [])

    if format == "md":
        lines = [
            f"### {name}",
            f"- **Size**: {w} × {h}",
            f"- **Background**: `{bg}`",
            f"- **Elements** ({len(elements)}):",
        ]
        for el in elements:
            lines.append(_element_summary(el))
    else:
        lines = [
            f"Artboard: {name}",
            f"  Size: {w}x{h}  Background: {bg}",
            f"  Elements ({len(elements)}):",
        ]
        for el in elements:
            lines.append(_element_summary(el))

    return "\n".join(lines)


async def generate_prompt_txt(document: dict) -> str:
    """Generate a plain-text specification from a ScafbindDocument."""
    project_name = document.get("name", "Untitled Project")
    pages: list[dict] = document.get("pages", [])

    sections = [
        f"PROJECT: {project_name}",
        f"Pages: {len(pages)}",
        "=" * 60,
    ]

    for page in pages:
        page_name = page.get("name", "Page")
        artboards: list[dict] = page.get("artboards", [])
        sections.append(f"\nPAGE: {page_name}  ({len(artboards)} artboards)")
        sections.append("-" * 40)
        for artboard in artboards:
            sections.append(_artboard_summary(artboard, format="txt"))
            sections.append("")

    return "\n".join(sections)


async def generate_prompt_md(document: dict) -> str:
    """Generate a Markdown specification from a ScafbindDocument."""
    project_name = document.get("name", "Untitled Project")
    pages: list[dict] = document.get("pages", [])

    sections = [
        f"# {project_name}",
        "",
        f"> **Pages**: {len(pages)}",
        "",
    ]

    for page in pages:
        page_name = page.get("name", "Page")
        artboards: list[dict] = page.get("artboards", [])
        sections.append(f"## Page: {page_name}")
        sections.append(f"*{len(artboards)} artboards*")
        sections.append("")
        for artboard in artboards:
            sections.append(_artboard_summary(artboard, format="md"))
            sections.append("")

    return "\n".join(sections)


# ---------------------------------------------------------------------------
# HTML export
# ---------------------------------------------------------------------------


def _element_to_html(element: dict, indent: int = 4) -> str:
    """Convert a single design element to an HTML snippet."""
    el_type = element.get("type", "div")
    x = element.get("x", 0)
    y = element.get("y", 0)
    w = element.get("width", 0)
    h = element.get("height", 0)
    name = element.get("name", "")

    base_style = (
        f"position:absolute;left:{x}px;top:{y}px;"
        f"width:{w}px;height:{h}px;"
    )
    pad = " " * indent

    if el_type == "text":
        content = element.get("content", "")
        font_size = element.get("fontSize", 16)
        color = element.get("color", "#000000")
        style = base_style + f"font-size:{font_size}px;color:{color};"
        return f'{pad}<p style="{style}">{content}</p>'

    elif el_type == "image":
        src = element.get("src", "")
        return f'{pad}<img src="{src}" alt="{name}" style="{base_style}object-fit:contain;" />'

    elif el_type == "rectangle":
        fill = element.get("fill", "transparent")
        border_radius = element.get("borderRadius", 0)
        style = base_style + f"background:{fill};border-radius:{border_radius}px;"
        return f'{pad}<div style="{style}"></div>'

    elif el_type == "ellipse":
        fill = element.get("fill", "transparent")
        style = base_style + f"background:{fill};border-radius:50%;"
        return f'{pad}<div style="{style}"></div>'

    else:
        fill = element.get("fill", "transparent")
        style = base_style + f"background:{fill};"
        return f'{pad}<div style="{style}" data-type="{el_type}"></div>'


async def generate_html(document: dict) -> str:
    """Generate a full HTML file from a ScafbindDocument."""
    project_name = document.get("name", "Untitled")
    pages: list[dict] = document.get("pages", [])

    # Collect all artboards across pages
    artboard_sections: list[str] = []
    for page in pages:
        for artboard in page.get("artboards", []):
            ab_name = artboard.get("name", "Artboard")
            w = artboard.get("width", 0)
            h = artboard.get("height", 0)
            bg = artboard.get("backgroundColor", "#FFFFFF")
            elements: list[dict] = artboard.get("elements", [])

            el_html = "\n".join(_element_to_html(el) for el in elements)

            artboard_sections.append(
                f"""  <section class="artboard" data-name="{ab_name}"
    style="position:relative;width:{w}px;height:{h}px;background:{bg};margin:40px auto;overflow:hidden;">
{el_html}
  </section>"""
            )

    artboards_html = "\n".join(artboard_sections)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{project_name}</title>
  <style>
    body {{ margin: 0; padding: 20px; background: #f0f0f0; font-family: sans-serif; box-sizing: border-box; }}
    .artboard {{ box-shadow: 0 4px 24px rgba(0,0,0,0.12); }}
  </style>
</head>
<body>
{artboards_html}
</body>
</html>
"""


# ---------------------------------------------------------------------------
# React export
# ---------------------------------------------------------------------------


def _element_to_jsx(element: dict, indent: int = 6) -> str:
    """Convert a single design element to a JSX snippet."""
    el_type = element.get("type", "div")
    x = element.get("x", 0)
    y = element.get("y", 0)
    w = element.get("width", 0)
    h = element.get("height", 0)
    name = element.get("name", "").replace(" ", "").replace("-", "_") or "el"
    pad = " " * indent

    base_style: dict[str, Any] = {
        "position": "absolute",
        "left": x,
        "top": y,
        "width": w,
        "height": h,
    }

    if el_type == "text":
        content = element.get("content", "")
        base_style["fontSize"] = element.get("fontSize", 16)
        base_style["color"] = element.get("color", "#000000")
        style_str = json.dumps(base_style)
        return f'{pad}<p style={{{style_str}}}>{content}</p>'

    elif el_type == "image":
        src = element.get("src", "")
        base_style["objectFit"] = "contain"
        style_str = json.dumps(base_style)
        return f'{pad}<img src="{src}" alt="{name}" style={{{style_str}}} />'

    elif el_type in ("rectangle", "ellipse"):
        base_style["background"] = element.get("fill", "transparent")
        if el_type == "ellipse":
            base_style["borderRadius"] = "50%"
        else:
            base_style["borderRadius"] = element.get("borderRadius", 0)
        style_str = json.dumps(base_style)
        return f'{pad}<div style={{{style_str}}} />'

    else:
        base_style["background"] = element.get("fill", "transparent")
        style_str = json.dumps(base_style)
        return f'{pad}<div data-type="{el_type}" style={{{style_str}}} />'


async def generate_react(document: dict) -> str:
    """Generate a React component file from a ScafbindDocument."""
    project_name = document.get("name", "Untitled")
    # Sanitize component name
    component_name = "".join(
        word.capitalize() for word in project_name.split()
    ) or "ScafbindExport"
    pages: list[dict] = document.get("pages", [])

    artboard_components: list[str] = []
    for page_idx, page in enumerate(pages):
        for ab_idx, artboard in enumerate(page.get("artboards", [])):
            ab_name = artboard.get("name", f"Artboard{ab_idx}")
            safe_name = "".join(
                word.capitalize() for word in ab_name.split()
            ) or f"Artboard{ab_idx}"
            w = artboard.get("width", 0)
            h = artboard.get("height", 0)
            bg = artboard.get("backgroundColor", "#FFFFFF")
            elements = artboard.get("elements", [])

            el_jsx = "\n".join(_element_to_jsx(el) for el in elements)

            artboard_components.append(
                f"""function {safe_name}() {{
  return (
    <div
      style={{{{
        position: "relative",
        width: {w},
        height: {h},
        background: "{bg}",
        overflow: "hidden",
      }}}}
    >
{el_jsx}
    </div>
  );
}}"""
            )

    component_names = []
    for page_idx, page in enumerate(pages):
        for ab_idx, artboard in enumerate(page.get("artboards", [])):
            ab_name = artboard.get("name", f"Artboard{ab_idx}")
            safe_name = "".join(word.capitalize() for word in ab_name.split()) or f"Artboard{ab_idx}"
            component_names.append(safe_name)

    artboards_render = "\n      ".join(
        f"<{name} />" for name in component_names
    )
    artboards_code = "\n\n".join(artboard_components)

    return f"""// Generated by Scafbind — {project_name}
import React from "react";

{artboards_code}

export default function {component_name}() {{
  return (
    <div style={{{{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}}}>
      {artboards_render}
    </div>
  );
}}
"""
