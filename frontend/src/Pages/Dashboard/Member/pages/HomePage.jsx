import React, { useCallback, useEffect, useState } from "react";
import {
  Building2,
  Gauge,
  Landmark,
  Banknote,
  HandCoins,
  MapPin,
  Users,
  UserCog,
} from "lucide-react";

import api from "../../../../api/axiosInstance";
import MembersModal from "../Modal/MembersModal";
import "./HomePage.css";

const MAX_MEMBERS = 20;
const HOME_MEMBER_PREVIEW = 5;

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

const rupees = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

// Labels a real score. It never creates one.
const cibilLabel = (score) => {
  if (score >= 750) return "Excellent";
  if (score >= 700) return "Good";
  if (score >= 650) return "Fair";
  return "Needs Improvement";
};

export default function HomePage({ user = {}, onNavigate }) {
  const [sangha, setSangha] = useState(null);
  const [members, setMembers] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showMembers, setShowMembers] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const [sanghaRes, membersRes, summaryRes] = await Promise.allSettled([
      api.get("/member/my-sangha"),
      api.get("/member/my-sangha/members"),
      api.get("/member/home-summary"),
    ]);

    if (sanghaRes.status === "fulfilled") {
      const data = sanghaRes.value.data;
      setSangha((Array.isArray(data) ? data[0] : data?.sanghas?.[0]) ?? null);
    } else {
      setError("Unable to load some of your dashboard information.");
    }

    if (membersRes.status === "fulfilled") {
      const data = membersRes.value.data;
      setMembers(Array.isArray(data) ? data : (data?.members ?? []));
    }

    if (summaryRes.status === "fulfilled") {
      setSummary(summaryRes.value.data);
    } else {
      setError("Unable to load some of your dashboard information.");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const firstName = (user.fullname || "Member").split(" ")[0];

  const hasSangha = !!sangha;
  const memberCount = sangha?.membersCount ?? members.length;
  const maxMembers = sangha?.maxMembers ?? MAX_MEMBERS;
  const location =
    [sangha?.city, sangha?.state].filter(Boolean).join(", ") || "N/A";

  const savings = summary?.savings ?? null;
  const cibil = summary?.cibilScore ?? null;
  const debt = Number(summary?.outstandingDebt ?? 0);

  const previewMembers = members.slice(0, HOME_MEMBER_PREVIEW);

  return (
    <div className="hp">
      {/* ================= SECTION 1: WELCOME ================= */}
      <section className="hp-welcome">
        <div>
          <h1 className="hp-welcome__title">
            {greeting()}, {firstName} 👋
          </h1>
          <p className="hp-welcome__subtitle">
            Here&apos;s your Sangha activity at a glance.
          </p>
        </div>

        <button
          type="button"
          className="hp-loan-btn"
          onClick={() => onNavigate?.("loans")}
        >
          <HandCoins size={18} />
          Loan Approval Request
        </button>
      </section>

      {error && (
        <div className="hp-error">
          {error}{" "}
          <button type="button" onClick={load}>
            Retry
          </button>
        </div>
      )}

      {/* ================= SECTION 2: FOUR CARDS ================= */}
      <section className="hp-cards">
        {/* My Sangha */}
        <article className="hp-card">
          <div className="hp-card__head">
            <span className="hp-card__icon">
              <Building2 size={18} />
            </span>
            <span className="hp-card__label">My Sangha</span>
          </div>
          <div className="hp-card__value hp-card__value--text">
            {loading ? "…" : hasSangha ? sangha.name : "Not Assigned"}
          </div>
          <div className="hp-card__sub">
            {loading ? "" : `${hasSangha ? memberCount : 0} Members`}
          </div>
        </article>

        {/* CIBIL */}
        <article className="hp-card">
          <div className="hp-card__head">
            <span className="hp-card__icon">
              <Gauge size={18} />
            </span>
            <span className="hp-card__label">CIBIL Score</span>
          </div>
          {loading ? (
            <div className="hp-card__value">…</div>
          ) : cibil ? (
            <>
              <div className="hp-card__value">{cibil}</div>
              <div className="hp-card__sub">{cibilLabel(cibil)}</div>
            </>
          ) : (
            <div className="hp-card__value hp-card__value--muted">
              Not Available
            </div>
          )}
        </article>

        {/* Sangha savings */}
        <article className="hp-card">
          <div className="hp-card__head">
            <span className="hp-card__icon">
              <Landmark size={18} />
            </span>
            <span className="hp-card__label">Sangha Savings Account</span>
          </div>
          {loading ? (
            <div className="hp-card__value">…</div>
          ) : savings ? (
            <>
              <div className="hp-card__value">{rupees(savings.balance)}</div>
              <div className="hp-card__sub">Current Balance</div>
            </>
          ) : (
            <>
              <div className="hp-card__value hp-card__value--muted">
                {hasSangha ? "Account Not Created" : "No Sangha"}
              </div>
              <div className="hp-card__sub">{rupees(0)} Current Balance</div>
            </>
          )}
        </article>

        {/* Debt */}
        <article className="hp-card">
          <div className="hp-card__head">
            <span className="hp-card__icon">
              <Banknote size={18} />
            </span>
            <span className="hp-card__label">Debt</span>
          </div>
          <div className="hp-card__value">{loading ? "…" : rupees(debt)}</div>
          <div className="hp-card__sub">
            {!loading && debt === 0 ? "No Active Loan" : "Outstanding Debt"}
          </div>
          {!loading && debt > 0 && (
            <div className="hp-card__interest">
              {Number(summary?.interestDue) > 0
                ? `+ ${rupees(summary.interestDue)} interest (${summary.interestRate}%) due`
                : `Interest (${summary?.interestRate ?? 2}%) paid this month`}
            </div>
          )}
        </article>
      </section>

      {/* ================= SECTION 3: MY SANGHA ================= */}
      <section className="hp-sangha">
        <h2 className="hp-sangha__title">My Sangha</h2>

        {loading ? (
          <p className="hp-muted">Loading Sangha information...</p>
        ) : !hasSangha ? (
          <div className="hp-empty">
            <Building2 size={26} />
            <strong>You are not currently assigned to a Sangha.</strong>
            <p>No Sangha information is available yet.</p>
          </div>
        ) : (
          <>
            <div className="hp-sangha__top">
              <div className="hp-sangha__name">{sangha.name}</div>
              <span className="hp-sangha__code">{sangha.code}</span>
            </div>

            <dl className="hp-sangha__details">
              <div>
                <dt>
                  <UserCog size={15} /> Admin
                </dt>
                <dd>{sangha.admin_name || "Not assigned"}</dd>
              </div>
              <div>
                <dt>
                  <MapPin size={15} /> Location
                </dt>
                <dd>{location}</dd>
              </div>
              <div>
                <dt>
                  <Users size={15} /> Members
                </dt>
                <dd>
                  {memberCount} / {maxMembers}
                </dd>
              </div>
            </dl>

            <h3 className="hp-sangha__sub">Members</h3>

            <ul className="hp-members">
              {sangha.admin_name && (
                <li className="hp-members__row">
                  <span className="hp-members__name">{sangha.admin_name}</span>
                  <span className="hp-role hp-role--admin">Admin</span>
                </li>
              )}

              {previewMembers.map((m) => (
                <li
                  key={m.id}
                  className={`hp-members__row ${
                    m.is_current_user ? "hp-members__row--you" : ""
                  }`}
                >
                  <span className="hp-members__name">
                    {m.name}
                    {m.is_current_user && " (You)"}
                  </span>
                  <span className="hp-role">Member</span>
                </li>
              ))}

              {members.length === 0 && (
                <li className="hp-members__row hp-muted">No members found.</li>
              )}
            </ul>

            <button
              type="button"
              className="hp-view-btn"
              onClick={() => setShowMembers(true)}
            >
              <Users size={16} />
              View All Members
            </button>
          </>
        )}
      </section>

      {showMembers && (
        <MembersModal
          sangha={sangha}
          members={members}
          loading={false}
          error=""
          onClose={() => setShowMembers(false)}
        />
      )}
    </div>
  );
}
