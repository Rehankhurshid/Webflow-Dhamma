"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

const BASE = "/portal";

interface Document {
    id: string;
    document_id: string;
    title: string;
    category: string;
    description: string;
    file_url: string;
    file_type: string;
    file_size_label: string;
    published_date: string;
}

interface Investor {
    id: string;
    investor_id: string;
    name: string;
    email: string;
    investor_type: string;
    is_active: boolean;
    is_admin: boolean;
}

function formatDate(input: string) {
    const d = new Date(input || "");
    if (isNaN(d.getTime())) return "Unknown date";
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function debounce<T extends (...args: unknown[]) => void>(fn: T, wait: number): T {
    let t: ReturnType<typeof setTimeout>;
    return ((...args: unknown[]) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); }) as T;
}

export default function DashboardPage() {
    const router = useRouter();
    const [investor, setInvestor] = useState<Investor | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [dateRule, setDateRule] = useState("all");
    const [sortRule, setSortRule] = useState("newest");
    const [loading, setLoading] = useState(true);
    const [downloadError, setDownloadError] = useState("");
    const [fetchError, setFetchError] = useState("");
    const downloadErrorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Auth check
    useEffect(() => {
        fetch(`${BASE}/api/auth/session`, { credentials: "include" })
            .then((r) => r.json() as Promise<{ authenticated: boolean; investor?: Investor }>)
            .then((data) => {
                if (!data.authenticated || !data.investor?.is_active) {
                    router.replace(`${BASE}/`);
                } else {
                    setInvestor(data.investor);
                }
            })
            .catch(() => router.replace(`${BASE}/`));
    }, [router]);

    // Fetch documents when investor ready
    useEffect(() => {
        if (!investor) return;
        const params = new URLSearchParams({ category, sort: sortRule, date: dateRule });
        setLoading(true);
        fetch(`${BASE}/api/documents?${params}`, { credentials: "include" })
            .then((r) => r.json() as Promise<{ documents?: Document[] }>)
            .then((data) => { setDocuments(data.documents || []); setFetchError(""); })
            .catch((err) => setFetchError(err.message || "Failed to load documents."))
            .finally(() => setLoading(false));
    }, [investor, category, sortRule, dateRule]);

    const filteredDocs = documents.filter((doc) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            doc.title.toLowerCase().includes(q) ||
            doc.category.toLowerCase().includes(q) ||
            doc.file_type.toLowerCase().includes(q)
        );
    });

    async function handleLogout() {
        try {
            await fetch(`${BASE}/api/auth/logout`, { method: "POST", credentials: "include" });
        } catch { /* ignore */ }
        router.replace(`${BASE}/`);
    }

    async function handleDownloadClick(e: React.MouseEvent<HTMLDivElement>) {
        const link = (e.target as HTMLElement).closest<HTMLAnchorElement>("[data-download-link]");
        if (!link) return;
        const href = link.getAttribute("href") || "";
        if (!href || href === "#") {
            e.preventDefault();
            showDownloadError("Document link is unavailable. Please contact support.");
            return;
        }
        try {
            await fetch(`${BASE}/api/documents/log-access`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    documentId: link.dataset.documentId || "",
                    documentTitle: link.dataset.documentTitle || "",
                    action: "download",
                }),
            });
        } catch { /* best effort */ }
    }

    function showDownloadError(msg: string) {
        setDownloadError(msg);
        if (downloadErrorTimer.current) clearTimeout(downloadErrorTimer.current);
        downloadErrorTimer.current = setTimeout(() => setDownloadError(""), 4000);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSearch = useCallback(debounce((v: unknown) => setSearch(v as string), 120), []);

    if (!investor) return null;

    return (
        <div className="page">
            <div className="brand">
                <div>
                    <h2>Dhamma Capital</h2>
                </div>
                <button
                    type="button"
                    onClick={handleLogout}
                    style={{ width: "auto" }}
                >
                    Sign Out
                </button>
            </div>

            <div className="dashboard-shell">
                <section className="hero">
                    <h1>Welcome, {investor.name}</h1>
                    <p>Investor Type: <strong>{(investor.investor_type || "").toUpperCase()}</strong></p>
                    <p>Access your reports, statements, and compliance documents.</p>
                </section>

                <section className="toolbar">
                    <div className="toolbar-grid">
                        <input
                            type="text"
                            placeholder="Search by title, category, type…"
                            onChange={(e) => debouncedSearch(e.target.value)}
                        />
                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option value="all">All categories</option>
                            <option value="quarterly reports">Quarterly Reports</option>
                            <option value="annual reports">Annual Reports</option>
                            <option value="statements">Statements</option>
                            <option value="tax documents">Tax Documents</option>
                            <option value="factsheets">Factsheets</option>
                            <option value="portfolio">Portfolio</option>
                            <option value="compliance">Compliance</option>
                            <option value="legal">Legal</option>
                            <option value="other">Other</option>
                        </select>
                        <select value={dateRule} onChange={(e) => setDateRule(e.target.value)}>
                            <option value="all">All time</option>
                            <option value="last7">Last 7 days</option>
                            <option value="last30">Last 30 days</option>
                            <option value="last90">Last 90 days</option>
                            <option value="thisyear">This year</option>
                        </select>
                        <select value={sortRule} onChange={(e) => setSortRule(e.target.value)}>
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="titleasc">Title A–Z</option>
                            <option value="titledesc">Title Z–A</option>
                        </select>
                    </div>

                    <div className="meta-row">
                        <p>{filteredDocs.length} document{filteredDocs.length === 1 ? "" : "s"} found</p>
                    </div>

                    <div className={`download-error${downloadError ? " visible" : ""}`}>{downloadError}</div>
                    <div className={`download-error${fetchError ? " visible" : ""}`}>{fetchError}</div>
                    <div className={`empty-state${!loading && filteredDocs.length === 0 && !fetchError ? " visible" : ""}`}>
                        No documents found matching your filters.
                    </div>

                    {loading && (
                        <div className="loading-skeleton" aria-hidden="true">
                            <div className="skeleton" />
                            <div className="skeleton" />
                            <div className="skeleton" />
                        </div>
                    )}

                    {!loading && (
                        <div
                            className="documents-grid"
                            onClick={handleDownloadClick}
                        >
                            {filteredDocs.map((doc) => (
                                <article key={doc.id} className="document-card">
                                    <h3>{doc.title}</h3>
                                    <p className="doc-meta">
                                        {doc.category || "Other"} · {(doc.file_type || "file").toUpperCase()} · {doc.file_size_label || "Unknown size"} · {formatDate(doc.published_date)}
                                    </p>
                                    <div className="doc-actions">
                                        <span className="pill">{doc.category || "Document"}</span>
                                        {doc.file_url ? (
                                            <a
                                                className="doc-link"
                                                href={doc.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                data-download-link
                                                data-document-id={doc.document_id || doc.id}
                                                data-document-title={doc.title}
                                            >
                                                Download
                                            </a>
                                        ) : (
                                            <a
                                                className="doc-link"
                                                href="#"
                                                data-download-link
                                                data-document-id={doc.document_id || doc.id}
                                                data-document-title={doc.title}
                                            >
                                                Download
                                            </a>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
