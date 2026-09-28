"""Render the planned architecture PNG. Requires Matplotlib; no app dependency."""

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch


def main():
    fig, ax = plt.subplots(figsize=(14, 8), dpi=160)
    fig.patch.set_facecolor("#f4f0e6")
    ax.set_facecolor("#f4f0e6")
    ax.set_xlim(0, 14)
    ax.set_ylim(-0.8, 8)
    ax.axis("off")
    ax.text(0.4, 7.5, "Portfolio / planned system architecture", fontsize=21,
            fontfamily="serif", color="#222222")
    ax.text(0.4, 7.05, "Static publication + isolated interactive guide • Desktop and mobile",
            fontsize=11, color="#555555")

    def box(x, y, title, detail, planned=True, width=3.4):
        ax.add_patch(FancyBboxPatch(
            (x, y), width, 1.2, boxstyle="round,pad=0.08,rounding_size=0.05",
            linewidth=1.4, linestyle="--" if planned else "-",
            edgecolor="#333333", facecolor="#fffdf7"))
        ax.text(x + 0.14, y + 0.86, title, fontsize=12, fontweight="bold")
        ax.text(x + 0.14, y + 0.18, detail, fontsize=9, linespacing=1.4)

    def arrow(start, end, label=""):
        ax.annotate("", xy=end, xytext=start,
                    arrowprops={"arrowstyle": "->", "color": "#9e4036", "lw": 1.5})
        if label:
            ax.text((start[0] + end[0]) / 2 + 0.06,
                    (start[1] + end[1]) / 2 + 0.1, label, fontsize=8,
                    color="#7b322a", bbox={"facecolor": "#f4f0e6", "edgecolor": "none", "pad": 2})

    box(0.4, 4.8, "Browser", "Editorial HTML + Vue guide\nText, voice, project navigation")
    box(5.2, 4.8, "Firebase Hosting", "Astro static output / CDN\nSame-origin API rewrite")
    box(10, 4.8, "Cloud Run / FastAPI", "Validate App Check + session\nRetrieve, reserve, call, settle")
    box(0.4, 2.4, "Versioned content", "Projects, articles, claim evidence\nBuild pages + knowledge artifact")
    box(5.2, 2.4, "Firestore", "Atomic quotas / budgets / cache\nRedacted questions + ratings")
    box(10, 2.4, "Provider adapters", "Grounded language model\nOptional speech services")
    box(5.2, 0.35, "Platform controls", "App Check / secrets / scoped IAM\nMetrics / spend controls / cleanup")
    arrow((3.85, 5.4), (5.08, 5.4), "HTML / API")
    arrow((8.65, 5.4), (9.88, 5.4), "API")
    arrow((2.1, 3.68), (5.25, 4.72), "build")
    arrow((3.88, 3.1), (10, 4.73), "evidence")
    arrow((10.1, 4.72), (8.45, 3.68), "reserve / settle")
    arrow((11.7, 4.72), (11.7, 3.68), "inference")
    ax.text(0.4, -0.55,
            "Current implementation: Astro + TypeScript + Vue scaffold only. Dashed boxes are planned.\n"
            "Publication remains usable when AI is unavailable. No raw IPs or prompts in application storage/logs.",
            fontsize=9, color="#555555")
    fig.savefig(Path(__file__).with_name("architecture-diagram.png"),
                facecolor=fig.get_facecolor(), bbox_inches="tight")
    plt.close(fig)


if __name__ == "__main__":
    main()
