import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import "./App.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type ApiState = {
  success: boolean;
  message: string;
  data?: unknown;
  errors?: unknown;
};

type CandidateList = {
  id: string;
  name: string;
  slogan?: string;
  order: number;
  isActive?: boolean;
};

type Scrutin = {
  id: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  status: string;
  candidateLists?: CandidateList[];
};

type AdminAuthData = {
  accessToken: string;
  refreshToken: string;
  admin: {
    email: string;
    role: string;
  };
};

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

function prettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

async function apiCall<T>(path: string, options?: RequestInit, accessToken?: string): Promise<T> {
  const headers = new Headers(options?.headers ?? {});
  headers.set("Content-Type", "application/json");
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const payload = (await response.json()) as T;
  if (!response.ok) {
    throw payload;
  }
  return payload;
}

function App() {
  const appRef = useRef<HTMLElement | null>(null);
  const revealRef = useRef<HTMLDivElement | null>(null);
  const pinTitleRef = useRef<HTMLDivElement | null>(null);
  const pinCardsRef = useRef<HTMLDivElement | null>(null);

  const [mode, setMode] = useState<"student" | "admin">("student");

  const [matricule, setMatricule] = useState("UCAO24A001");
  const [email, setEmail] = useState("groupeflutter@gmail.com");
  const [sessionToken, setSessionToken] = useState("");
  const [otp, setOtp] = useState("");
  const [candidateListId, setCandidateListId] = useState("");
  const [activeScrutin, setActiveScrutin] = useState<Scrutin | null>(null);

  const [adminEmail, setAdminEmail] = useState("admin@ucao-uut.tg");
  const [adminPassword, setAdminPassword] = useState("admin12345");
  const [adminToken, setAdminToken] = useState("");
  const [adminInfo, setAdminInfo] = useState<{ email: string; role: string } | null>(null);
  const [adminScrutins, setAdminScrutins] = useState<Scrutin[]>([]);
  const [selectedScrutinId, setSelectedScrutinId] = useState("seed-scrutin-active");
  const [adminCandidateLists, setAdminCandidateLists] = useState<CandidateList[]>([]);

  const [scrutinForm, setScrutinForm] = useState({
    title: "Election BGDE Demo",
    description: "Scrutin pour recette admin",
    startsAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: "SCHEDULED",
  });

  const [candidateForm, setCandidateForm] = useState({
    scrutinId: "seed-scrutin-active",
    name: "Alliance Campus",
    slogan: "Unite et resultats",
    description: "Liste candidate ajoutee depuis le dashboard admin frontend",
    order: 3,
  });

  const [latestResponse, setLatestResponse] = useState<ApiState | null>(null);
  const [loading, setLoading] = useState(false);
  const canSubmitVote = sessionToken.trim().length >= 20 && candidateListId.trim().length >= 8;

  const revealWords = useMemo(
    () =>
      "Deux parcours de recette dans une seule interface: etudiant pour le vote OTP, puis administrateur pour piloter scrutins et listes candidates."
        .split(" "),
    [],
  );

  useGSAP(
    () => {
      if (!appRef.current || !revealRef.current || !pinTitleRef.current || !pinCardsRef.current) {
        return;
      }

      gsap.fromTo(
        ".hero-block",
        { y: 80, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.1, ease: "power3.out", stagger: 0.12 },
      );

      gsap.utils.toArray<HTMLElement>(".motion-image").forEach((card) => {
        gsap.fromTo(
          card,
          { scale: 0.82, opacity: 0.3, filter: "grayscale(90%)" },
          {
            scale: 1,
            opacity: 1,
            filter: "grayscale(0%)",
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 80%",
              end: "bottom 20%",
              scrub: true,
            },
          },
        );
      });

      ScrollTrigger.create({
        trigger: pinCardsRef.current,
        start: "top top+=120",
        end: "bottom bottom-=120",
        pin: pinTitleRef.current,
      });

      gsap.fromTo(
        ".reveal-word",
        { opacity: 0.1 },
        {
          opacity: 1,
          stagger: 0.06,
          scrollTrigger: {
            trigger: revealRef.current,
            start: "top 80%",
            end: "bottom 55%",
            scrub: true,
          },
        },
      );
    },
    { scope: appRef },
  );

  useEffect(() => {
    const firstCandidate = activeScrutin?.candidateLists?.[0]?.id;
    if (firstCandidate) {
      setCandidateListId(firstCandidate);
    }
  }, [activeScrutin]);

  useEffect(() => {
    if (selectedScrutinId) {
      setCandidateForm((prev) => ({ ...prev, scrutinId: selectedScrutinId }));
    }
  }, [selectedScrutinId]);

  async function loadActiveScrutin() {
    await runRequest(async () => {
      const payload = await apiCall<ApiState>("/scrutin/active");
      const data = payload.data as Scrutin;
      setActiveScrutin(data);
      return payload;
    });
  }

  useEffect(() => {
    void loadActiveScrutin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runRequest(action: () => Promise<ApiState>) {
    setLoading(true);
    try {
      const payload = await action();
      setLatestResponse(payload);
      if (payload?.data && typeof payload.data === "object") {
        const maybeToken = (payload.data as { sessionToken?: string }).sessionToken;
        const maybeDebugOtp = (payload.data as { debugOtp?: string }).debugOtp;
        if (maybeToken) {
          setSessionToken(maybeToken);
        }
        if (maybeDebugOtp) {
          setOtp(maybeDebugOtp);
        }
      }
    } catch (error) {
      setLatestResponse(error as ApiState);
    } finally {
      setLoading(false);
    }
  }

  async function loginAdmin() {
    await runRequest(async () => {
      const payload = await apiCall<ApiState>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });
      const data = payload.data as AdminAuthData;
      setAdminToken(data.accessToken);
      setAdminInfo(data.admin);
      return payload;
    });
  }

  async function loadAdminScrutins() {
    await runRequest(async () => {
      const payload = await apiCall<ApiState>("/admin/scrutins", { method: "GET" }, adminToken);
      const list = (payload.data as Scrutin[]) ?? [];
      setAdminScrutins(list);
      if (list[0]?.id) {
        setSelectedScrutinId(list[0].id);
      }
      return payload;
    });
  }

  async function loadCandidateListsByScrutin() {
    if (!selectedScrutinId) return;
    await runRequest(async () => {
      const payload = await apiCall<ApiState>(
        `/admin/candidate-lists/scrutin/${selectedScrutinId}`,
        { method: "GET" },
        adminToken,
      );
      setAdminCandidateLists((payload.data as CandidateList[]) ?? []);
      return payload;
    });
  }

  async function createScrutin() {
    await runRequest(async () => {
      const payload = await apiCall<ApiState>(
        "/admin/scrutins",
        {
          method: "POST",
          body: JSON.stringify(scrutinForm),
        },
        adminToken,
      );
      return payload;
    });
  }

  async function createCandidateList() {
    await runRequest(async () => {
      const payload = await apiCall<ApiState>(
        "/admin/candidate-lists",
        {
          method: "POST",
          body: JSON.stringify(candidateForm),
        },
        adminToken,
      );
      return payload;
    });
  }

  return (
    <main className="app" ref={appRef}>
      <nav className="floating-nav">
        <span className="brand">VoteBGDE Test Console</span>
        <div className="mode-switch">
          <button className={`nav-pill ${mode === "student" ? "active" : ""}`} onClick={() => setMode("student")}>
            Mode etudiant
          </button>
          <button className={`nav-pill ${mode === "admin" ? "active" : ""}`} onClick={() => setMode("admin")}>
            Dashboard admin
          </button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-text hero-block">
          <p className="hero-kicker">Frontend React de validation</p>
          <h1>
            Recette etudiante et
            <span className="inline-image" aria-hidden="true" />
            administration dans un seul cockpit.
          </h1>
          <p>
            Tu peux maintenant verifier le vote OTP en public, puis basculer sur le dashboard admin pour creer et gerer scrutins et listes candidates.
          </p>
        </div>
        <div className="hero-media hero-block">
          <div className="motion-image media-card" style={{ backgroundImage: "url('https://picsum.photos/seed/voting-operations/1200/900')" }} />
          <div className="motion-image media-card small" style={{ backgroundImage: "url('https://picsum.photos/seed/secure-ballot/1200/900')" }} />
        </div>
      </section>

      {mode === "student" ? (
        <section className="bento-section">
          <div className="bento-grid">
            <article className="card span-3">
              <h3>1. Scrutin actif</h3>
              <p>Charge le scrutin public et ses listes candidates pour preparer le vote.</p>
              <button
                className="btn btn-dark"
                disabled={loading}
                onClick={() => void loadActiveScrutin()}
              >
                Charger scrutin
              </button>
            </article>

            <article className="card span-3">
              <h3>2. OTP send</h3>
              <p>Valide le matricule puis envoie un OTP sur le mail saisi.</p>
              <div className="field-wrap">
                <input value={matricule} onChange={(e) => setMatricule(e.target.value)} placeholder="Matricule" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
              </div>
              <button
                className="btn btn-dark"
                disabled={loading}
                onClick={() =>
                  runRequest(() =>
                    apiCall<ApiState>("/otp/send", {
                      method: "POST",
                      body: JSON.stringify({ matricule, email }),
                    }),
                  )
                }
              >
                Envoyer OTP
              </button>
            </article>

            <article className="card span-2">
              <h3>3. OTP verify</h3>
              <p>En local (`MAIL_TRANSPORT=json`), le code est auto-rempli apres `Envoyer OTP`.</p>
              <div className="field-wrap">
                <input value={sessionToken} onChange={(e) => setSessionToken(e.target.value)} placeholder="Session token" />
                <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Code OTP" />
              </div>
              <button
                className="btn btn-dark"
                disabled={loading}
                onClick={() =>
                  runRequest(() =>
                    apiCall<ApiState>("/otp/verify", {
                      method: "POST",
                      body: JSON.stringify({ sessionToken, otp }),
                    }),
                  )
                }
              >
                Verifier OTP
              </button>
            </article>

            <article className="card span-2">
              <h3>4. Cast vote</h3>
              <div className="field-wrap">
                <input value={candidateListId} onChange={(e) => setCandidateListId(e.target.value)} placeholder="candidateListId" />
              </div>
              <button
                className="btn btn-dark"
                disabled={loading || !canSubmitVote}
                onClick={() =>
                  runRequest(() =>
                    apiCall<ApiState>("/vote", {
                      method: "POST",
                      body: JSON.stringify({
                        sessionToken: sessionToken.trim(),
                        candidateListId: candidateListId.trim(),
                      }),
                    }),
                  )
                }
              >
                Envoyer vote
              </button>
              {!canSubmitVote && (
                <p>Verification requise: session OTP invalide ou liste candidate non selectionnee.</p>
              )}
            </article>

            <article className="card span-2">
              <h3>Listes candidates</h3>
              <div className="candidate-list">
                {(activeScrutin?.candidateLists ?? []).map((item) => (
                  <button key={item.id} className="candidate-item" onClick={() => setCandidateListId(item.id)}>
                    <span>{item.name}</span>
                    <small>{item.id}</small>
                  </button>
                ))}
                {!(activeScrutin?.candidateLists?.length) && <p>Aucune liste chargee.</p>}
              </div>
            </article>
          </div>
        </section>
      ) : (
        <section className="bento-section">
          <div className="bento-grid">
            <article className="card span-3">
              <h3>Connexion admin</h3>
              <div className="field-wrap">
                <input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="Email admin" />
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Mot de passe"
                />
              </div>
              <button className="btn btn-dark" onClick={loginAdmin} disabled={loading}>
                Se connecter
              </button>
              <p>
                Connecte: {adminInfo ? `${adminInfo.email} (${adminInfo.role})` : "non"}
              </p>
            </article>

            <article className="card span-3">
              <h3>Scrutins admin</h3>
              <div className="row-actions">
                <button className="btn btn-dark" onClick={loadAdminScrutins} disabled={loading || !adminToken}>
                  Charger scrutins
                </button>
                <button className="btn btn-dark" onClick={loadCandidateListsByScrutin} disabled={loading || !adminToken}>
                  Charger listes du scrutin
                </button>
              </div>
              <div className="candidate-list">
                {adminScrutins.map((s) => (
                  <button key={s.id} className="candidate-item" onClick={() => setSelectedScrutinId(s.id)}>
                    <span>{s.title}</span>
                    <small>{s.id} - {s.status}</small>
                  </button>
                ))}
              </div>
            </article>

            <article className="card span-3">
              <h3>Creer un scrutin</h3>
              <div className="field-wrap">
                <input value={scrutinForm.title} onChange={(e) => setScrutinForm((p) => ({ ...p, title: e.target.value }))} placeholder="Titre" />
                <input value={scrutinForm.description} onChange={(e) => setScrutinForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" />
                <input value={scrutinForm.startsAt} onChange={(e) => setScrutinForm((p) => ({ ...p, startsAt: e.target.value }))} placeholder="startsAt ISO" />
                <input value={scrutinForm.endsAt} onChange={(e) => setScrutinForm((p) => ({ ...p, endsAt: e.target.value }))} placeholder="endsAt ISO" />
                <input value={scrutinForm.status} onChange={(e) => setScrutinForm((p) => ({ ...p, status: e.target.value }))} placeholder="Status" />
              </div>
              <button className="btn btn-dark" onClick={createScrutin} disabled={loading || !adminToken}>
                Creer scrutin
              </button>
            </article>

            <article className="card span-3">
              <h3>Creer liste candidate</h3>
              <div className="field-wrap">
                <input value={candidateForm.scrutinId} onChange={(e) => setCandidateForm((p) => ({ ...p, scrutinId: e.target.value }))} placeholder="Scrutin ID" />
                <input value={candidateForm.name} onChange={(e) => setCandidateForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nom de liste" />
                <input value={candidateForm.slogan} onChange={(e) => setCandidateForm((p) => ({ ...p, slogan: e.target.value }))} placeholder="Slogan" />
                <input
                  value={candidateForm.description}
                  onChange={(e) => setCandidateForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Description"
                />
                <input
                  type="number"
                  value={candidateForm.order}
                  onChange={(e) => setCandidateForm((p) => ({ ...p, order: Number(e.target.value) }))}
                  placeholder="Ordre"
                />
              </div>
              <button className="btn btn-dark" onClick={createCandidateList} disabled={loading || !adminToken}>
                Creer liste
              </button>
              <div className="candidate-list">
                {adminCandidateLists.map((item) => (
                  <div key={item.id} className="candidate-item static">
                    <span>{item.name}</span>
                    <small>{item.id} - ordre {item.order}</small>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      )}

      <section className="pin-section" id="tester" ref={pinCardsRef}>
        <div className="pin-title" ref={pinTitleRef}>
          <h2>Journal des reponses API</h2>
          <p>Chaque action de test met a jour le panneau avec la reponse brute du backend.</p>
        </div>
        <div className="pin-content">
          <div className="log-box">
            <pre>{prettyJson(latestResponse ?? { success: false, message: "Aucune requete executee pour le moment." })}</pre>
          </div>
        </div>
      </section>

      <section className="reveal-section" ref={revealRef}>
        <p>
          {revealWords.map((word, index) => (
            <span className="reveal-word" key={`${word}-${index}`}>
              {word}{" "}
            </span>
          ))}
        </p>
      </section>
    </main>
  );
}

export default App;
