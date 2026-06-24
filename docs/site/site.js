const searchInput = document.querySelector("#docSearch");
const searchCount = document.querySelector("#searchCount");
const blocks = Array.from(document.querySelectorAll(".doc-block"));
const navLinks = Array.from(document.querySelectorAll("#sectionNav a"));
const sections = Array.from(document.querySelectorAll("main [id]"));

function normalize(value) {
  return value.trim().toLowerCase();
}

function updateFilter() {
  const query = normalize(searchInput.value);
  let visible = 0;

  blocks.forEach((block) => {
    const haystack = normalize(`${block.textContent} ${block.dataset.search || ""}`);
    const matches = !query || haystack.includes(query);
    block.classList.toggle("is-hidden", !matches);
    if (matches) visible += 1;
  });

  navLinks.forEach((link) => {
    const target = document.querySelector(link.getAttribute("href"));
    link.classList.toggle("is-hidden", Boolean(query) && target?.classList.contains("is-hidden"));
  });

  if (!query) {
    searchCount.textContent = "All sections visible";
  } else {
    searchCount.textContent = `${visible} matching ${visible === 1 ? "block" : "blocks"}`;
  }
}

function setActiveNav(id) {
  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
  });
}

if (searchInput) {
  searchInput.addEventListener("input", updateFilter);
}

const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (visible?.target?.id) {
      setActiveNav(visible.target.id);
    }
  },
  {
    rootMargin: "-20% 0px -55% 0px",
    threshold: [0.08, 0.2, 0.45],
  },
);

sections.forEach((section) => observer.observe(section));
setActiveNav("overview");
