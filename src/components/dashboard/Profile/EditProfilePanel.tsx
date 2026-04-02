import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
  User,
  Building,
  Shield,
  Target,
  BookOpen,
  Plus,
  Check,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { GetEditableProfile, UpdateEditableProfile } from '../../../../api/profileApis';
import { GetFilterOptions } from '../../../../api/mentorshipApis';
import { showToast } from '../../../Helper/ShowToast';

// ── Option constants (matching onboarding) ──────────────────────────────────

const AVATAR_EMOJIS = [
  '🌟', '⭐', '✨', '💫', '🔥', '⚡', '💎', '👑', '🏆', '🎯', '🎨', '🎭',
  '🎪', '🎬', '🎮', '🎲', '🎸', '🎹', '🎺', '🎻', '📦', '📚', '📖', '📝',
  '📌', '📍', '📎', '📐', '📏', '📊', '⚙️', '🔧', '🔨', '⚒️', '🛠️', '🔩',
  '⚗️', '🧪', '🧬', '🔬', '🚀', '✈️', '🛸', '🎈', '🎆', '🎇', '🌈', '☀️',
  '🌙', '💼', '🎓', '🏅', '🥇', '🥈', '🥉', '🏵️', '🎖️', '🔔', '🔑', '🗝️',
  '💡', '🔦', '🕯️', '🧭', '🗺️', '⏰', '⏱️', '⌚', '🔮',
];

const CAREER_LEVELS = [
  'Entry Level (0-2 years)',
  'Mid-level (3-7 years)',
  'Senior (8-12 years)',
  'Leadership (13+ years)',
  'Executive/C-Suite',
];

const RACES = [
  'Black/African American',
  'Hispanic/Latino',
  'Asian/Pacific Islander',
  'Native American',
  'Middle Eastern',
  'Mixed/Multiracial',
  'White',
  'Prefer not to say',
];

const GENDERS = ['Woman', 'Man', 'Non-binary', 'Prefer not to say'];

const AFFINITY_TAGS = [
  { id: 'black-women-tech', label: 'Black Women in Tech', icon: '👩🏾‍💻' },
  { id: 'latino-leaders', label: 'Latino Leaders', icon: '🌟' },
  { id: 'lgbtq-finance', label: 'LGBTQ+ in Finance', icon: '🏳️‍🌈' },
  { id: 'asian-entrepreneurs', label: 'Asian Entrepreneurs', icon: '🚀' },
  { id: 'women-leadership', label: 'Women in Leadership', icon: '👑' },
  { id: 'first-gen-college', label: 'First-Gen College Grads', icon: '🎓' },
  { id: 'working-parents', label: 'Working Parents', icon: '👨‍👩‍👧‍👦' },
  { id: 'military-veterans', label: 'Military Veterans', icon: '🇺🇸' },
  { id: 'disabled-professionals', label: 'Disabled Professionals', icon: '♿' },
  { id: 'immigrant-professionals', label: 'Immigrant Professionals', icon: '🌍' },
];

const STATIC_COMPANIES = [
  'Google', 'Microsoft', 'Apple', 'Amazon', 'Meta',
  'Netflix', 'Tesla', 'Goldman Sachs', 'JPMorgan Chase',
  'Bank of America', 'Wells Fargo', 'McKinsey & Company',
  'Boston Consulting Group', 'Deloitte', 'PwC',
  'Johnson & Johnson', 'Pfizer', 'Merck', 'Abbott',
  'Bristol Myers Squibb',
];

// ── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ title, icon: Icon, expanded, onToggle }: {
  title: string; icon: any; expanded: boolean; onToggle: () => void;
}) {
  return (
    <button onClick={onToggle} className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-semibold text-gray-900">{title}</span>
      </div>
      {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
    </button>
  );
}

function TagInput({ tags, onAdd, onRemove, placeholder }: {
  tags: string[]; onAdd: (v: string) => void; onRemove: (v: string) => void; placeholder: string;
}) {
  const [input, setInput] = useState('');
  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) { onAdd(trimmed); setInput(''); }
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
            {t}
            <button onClick={() => onRemove(t)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button onClick={addTag} className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function SelectField({ options, selected, onSelect, placeholder }: {
  options: string[]; selected: string; onSelect: (v: string) => void; placeholder: string;
}) {
  return (
    <select
      value={selected}
      onChange={(e) => onSelect(e.target.value)}
      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  );
}

function MultiSelectDropdown({ label, options, selected, onSelect, onRemove }: {
  label: string; options: string[]; selected: string[]; onSelect: (v: string) => void; onRemove: (v: string) => void;
}) {
  const available = options.filter((o) => !selected.includes(o));
  return (
    <div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
              {t}
              <button onClick={() => onRemove(t)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
      {available.length > 0 && (
        <select
          value=""
          onChange={(e) => { if (e.target.value) onSelect(e.target.value); }}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
        >
          <option value="">Select {label}...</option>
          {available.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      )}
    </div>
  );
}

function UrgencySelector({ value, onSelect }: { value: string; onSelect: (v: string) => void }) {
  const levels = [
    { key: 'low', label: 'Low', color: 'green' },
    { key: 'medium', label: 'Medium', color: 'yellow' },
    { key: 'high', label: 'High', color: 'red' },
  ];
  return (
    <div className="flex gap-2">
      {levels.map((l) => (
        <button key={l.key} onClick={() => onSelect(l.key)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
            value === l.key
              ? l.color === 'green' ? 'border-green-500 bg-green-50 text-green-700'
                : l.color === 'yellow' ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                : 'border-red-500 bg-red-50 text-red-700'
              : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
          }`}>
          {l.label}
        </button>
      ))}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

interface EditProfilePanelProps {
  onClose: () => void;
}

export function EditProfilePanel({ onClose }: EditProfilePanelProps) {
  const { user, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const originalRef = useRef<any>(null);
  const [filterOptions, setFilterOptions] = useState<any>(null);
  const [showCompanyConfirm, setShowCompanyConfirm] = useState(false);
  const pendingPayloadRef = useRef<any>(null);

  // Section expansion
  const [sections, setSections] = useState({
    basic: true, company: false, identity: false, mentor: false, mentee: false,
  });
  const toggle = (key: keyof typeof sections) => setSections((p) => ({ ...p, [key]: !p[key] }));

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [yearsExp, setYearsExp] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [showCompanyList, setShowCompanyList] = useState(false);

  const [careerLevel, setCareerLevel] = useState('');
  const [race, setRace] = useState('');
  const [gender, setGender] = useState('');
  const [affinityTags, setAffinityTags] = useState<string[]>([]);

  const [mentorBio, setMentorBio] = useState('');
  const [expertise, setExpertise] = useState<string[]>([]);
  const [mentorIndustries, setMentorIndustries] = useState<string[]>([]);
  const [mentorAvail, setMentorAvail] = useState('');
  const [responseTime, setResponseTime] = useState('');
  const [mentoringStyle, setMentoringStyle] = useState('');
  const [mentorLangs, setMentorLangs] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState('');

  const [menteeBio, setMenteeBio] = useState('');
  const [goals, setGoals] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [menteeIndustries, setMenteeIndustries] = useState<string[]>([]);
  const [menteeAvail, setMenteeAvail] = useState('');
  const [urgency, setUrgency] = useState('');
  const [topic, setTopic] = useState('');
  const [mentoredStyle, setMentoredStyle] = useState('');
  const [menteeLangs, setMenteeLangs] = useState<string[]>([]);
  const [commMethod, setCommMethod] = useState('');

  const [hasMentor, setHasMentor] = useState(false);
  const [hasMentee, setHasMentee] = useState(false);

  // Load
  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch filter options for mentor/mentee dropdowns
      try {
        const filtersRes = await GetFilterOptions();
        setFilterOptions(filtersRes?.data ?? filtersRes);
      } catch {}
      const res = await GetEditableProfile();
      const data = res?.data ?? res;
      originalRef.current = JSON.parse(JSON.stringify(data));

      const b = data.basic || {};
      setFirstName(b.first_name || ''); setLastName(b.last_name || '');
      setUsername(b.username || ''); setAvatar(b.avatar || '');
      setBio(b.bio || ''); setJobTitle(b.job_title || '');
      setLocation(b.location || '');
      setYearsExp(b.years_experience ? String(b.years_experience) : '');
      setSkills(b.skills || []);

      setCompanyName(data.company?.company_name || '');

      const id = data.identity || {};
      setCareerLevel(id.career_level || ''); setRace(id.race || ''); setGender(id.gender || '');
      setAffinityTags(Array.isArray(id.affinity_tags) ? id.affinity_tags : []);

      if (data.mentor) {
        setHasMentor(true);
        setMentorBio(data.mentor.mentor_bio || '');
        setExpertise(data.mentor.expertise || []);
        setMentorIndustries(data.mentor.industries || []);
        setMentorAvail(data.mentor.availability || '');
        setResponseTime(data.mentor.response_time || '');
        setMentoringStyle(data.mentor.mentoring_style || '');
        setMentorLangs(data.mentor.languages || []);
        setHourlyRate(data.mentor.hourly_rate != null ? String(data.mentor.hourly_rate) : '');
      }
      if (data.mentee) {
        setHasMentee(true);
        setMenteeBio(data.mentee.mentee_bio || '');
        setGoals(data.mentee.goals || '');
        setInterests(data.mentee.interests || []);
        setMenteeIndustries(data.mentee.industries || []);
        setMenteeAvail(data.mentee.availability || '');
        setUrgency(data.mentee.urgency || '');
        setTopic(data.mentee.topic || '');
        setMentoredStyle(data.mentee.mentored_style || '');
        setMenteeLangs(data.mentee.languages || []);
        setCommMethod(data.mentee.communication_method || '');
      }
    } catch {
      showToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // Build diff
  const buildPayload = () => {
    const orig = originalRef.current;
    if (!orig) return {};
    const payload: any = {};

    const bd: any = {};
    if (firstName !== (orig.basic?.first_name || '')) bd.first_name = firstName;
    if (lastName !== (orig.basic?.last_name || '')) bd.last_name = lastName;
    if (username !== (orig.basic?.username || '')) bd.username = username;
    if (avatar !== (orig.basic?.avatar || '')) bd.avatar = avatar;
    if (bio !== (orig.basic?.bio || '')) bd.bio = bio;
    if (jobTitle !== (orig.basic?.job_title || '')) bd.job_title = jobTitle;
    if (location !== (orig.basic?.location || '')) bd.location = location;
    const yn = yearsExp ? parseInt(yearsExp, 10) : 0;
    if (yn !== (orig.basic?.years_experience || 0)) bd.years_experience = yn;
    if (JSON.stringify(skills) !== JSON.stringify(orig.basic?.skills || [])) bd.skills = skills;
    if (Object.keys(bd).length) payload.basic = bd;

    if (companyName !== (orig.company?.company_name || '')) payload.company = { company_name: companyName };

    const id: any = {};
    if (careerLevel !== (orig.identity?.career_level || '')) id.career_level = careerLevel;
    if (race !== (orig.identity?.race || '')) id.race = race;
    if (gender !== (orig.identity?.gender || '')) id.gender = gender;
    const ot = Array.isArray(orig.identity?.affinity_tags) ? orig.identity.affinity_tags : [];
    if (JSON.stringify(affinityTags) !== JSON.stringify(ot)) id.affinity_tags = JSON.stringify(affinityTags);
    if (Object.keys(id).length) payload.identity = id;

    if (hasMentor) {
      const md: any = {};
      if (mentorBio !== (orig.mentor?.mentor_bio || '')) md.mentor_bio = mentorBio;
      if (JSON.stringify(expertise) !== JSON.stringify(orig.mentor?.expertise || [])) md.expertise = expertise;
      if (JSON.stringify(mentorIndustries) !== JSON.stringify(orig.mentor?.industries || [])) md.industries = mentorIndustries;
      if (mentorAvail !== (orig.mentor?.availability || '')) md.availability = mentorAvail;
      if (responseTime !== (orig.mentor?.response_time || '')) md.response_time = responseTime;
      if (mentoringStyle !== (orig.mentor?.mentoring_style || '')) md.mentoring_style = mentoringStyle;
      if (JSON.stringify(mentorLangs) !== JSON.stringify(orig.mentor?.languages || [])) md.languages = mentorLangs;
      const rn = hourlyRate ? parseInt(hourlyRate, 10) : 0;
      if (rn !== (orig.mentor?.hourly_rate || 0)) md.hourly_rate = rn;
      if (Object.keys(md).length) payload.mentor = md;
    }

    if (hasMentee) {
      const me: any = {};
      if (menteeBio !== (orig.mentee?.mentee_bio || '')) me.mentee_bio = menteeBio;
      if (goals !== (orig.mentee?.goals || '')) me.goals = goals;
      if (JSON.stringify(interests) !== JSON.stringify(orig.mentee?.interests || [])) me.interests = interests;
      if (JSON.stringify(menteeIndustries) !== JSON.stringify(orig.mentee?.industries || [])) me.industries = menteeIndustries;
      if (menteeAvail !== (orig.mentee?.availability || '')) me.availability = menteeAvail;
      if (urgency !== (orig.mentee?.urgency || '')) me.urgency = urgency;
      if (topic !== (orig.mentee?.topic || '')) me.topic = topic;
      if (mentoredStyle !== (orig.mentee?.mentored_style || '')) me.mentored_style = mentoredStyle;
      if (JSON.stringify(menteeLangs) !== JSON.stringify(orig.mentee?.languages || [])) me.languages = menteeLangs;
      if (commMethod !== (orig.mentee?.communication_method || '')) me.communication_method = commMethod;
      if (Object.keys(me).length) payload.mentee = me;
    }

    return payload;
  };

  // Save
  const submitPayload = async (payload: any) => {
    setSaving(true);
    try {
      const res = await UpdateEditableProfile(payload);
      const updated = res?.data ?? res;
      originalRef.current = JSON.parse(JSON.stringify(updated));

      // If company changed, log out so fresh state loads on next login
      if (payload.company?.company_name) {
        showToast('Company updated! Logging out...', 'success');
        setTimeout(() => logout(), 1000);
        return;
      }

      if (payload.basic) {
        const u: any = {};
        if (payload.basic.username) u.username = payload.basic.username;
        if (payload.basic.avatar) u.avatar = payload.basic.avatar;
        if (payload.basic.first_name) u.first_name = payload.basic.first_name;
        if (payload.basic.last_name) u.last_name = payload.basic.last_name;
        if (Object.keys(u).length) updateUser(u);
      }

      showToast('Profile updated!', 'success');
      onClose();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    const payload = buildPayload();
    if (!Object.keys(payload).length) { showToast('No changes to save', 'info'); return; }

    if (payload.company?.company_name) {
      pendingPayloadRef.current = payload;
      setShowCompanyConfirm(true);
      return;
    }

    submitPayload(payload);
  };

  const handleConfirmCompanyChange = () => {
    setShowCompanyConfirm(false);
    if (pendingPayloadRef.current) {
      submitPayload(pendingPayloadRef.current);
      pendingPayloadRef.current = null;
    }
  };

  const filteredCompanies = companyName
    ? STATIC_COMPANIES.filter((c) => c.toLowerCase().includes(companyName.toLowerCase()))
    : STATIC_COMPANIES;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-sm text-gray-600">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
      <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300 relative">
        {/* Saving overlay */}
        {saving && (
          <div className="absolute inset-0 bg-white/70 z-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#7c3aed] animate-spin" />
            <span className="text-sm font-medium text-gray-700">Updating profile...</span>
          </div>
        )}
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            <h2 className="text-lg font-bold text-gray-900">Edit My Profile</h2>
          </div>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="p-4 space-y-3">

          {/* BASIC INFO */}
          <SectionHeader title="Basic Info" icon={User} expanded={sections.basic} onToggle={() => toggle('basic')} />
          {sections.basic && (
            <div className="space-y-4 p-4 bg-white border border-gray-100 rounded-lg">
              {/* Avatar */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Avatar</label>
                <button onClick={() => setShowAvatarPicker(!showAvatarPicker)} className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 hover:bg-blue-100 transition-colors">
                  <span className="text-2xl">{avatar || '👤'}</span>
                  <span className="text-sm text-blue-700 font-medium">Tap to change</span>
                </button>
                {showAvatarPicker && (
                  <div className="flex flex-wrap gap-1.5 mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                    {AVATAR_EMOJIS.map((e) => (
                      <button key={e} onClick={() => { setAvatar(e); setShowAvatarPicker(false); }}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg hover:bg-blue-100 transition-colors ${avatar === e ? 'bg-blue-200 ring-2 ring-blue-500' : ''}`}>
                        <span className="text-lg">{e}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">First Name</label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Last Name</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Username</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Job Title</label>
                <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Senior Product Designer" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Location</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. New York, NY" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Years of Experience</label>
                <input type="number" value={yearsExp} onChange={(e) => setYearsExp(e.target.value)} placeholder="e.g. 8" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Skills</label>
                <TagInput tags={skills} onAdd={(v) => setSkills([...skills, v])} onRemove={(v) => setSkills(skills.filter((s) => s !== v))} placeholder="Add a skill..." />
              </div>
            </div>
          )}

          {/* COMPANY */}
          <SectionHeader title="Company" icon={Building} expanded={sections.company} onToggle={() => toggle('company')} />
          {sections.company && (
            <div className="space-y-4 p-4 bg-white border border-gray-100 rounded-lg">
              <div className="relative">
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Company Name</label>
                <input type="text" value={companyName} onChange={(e) => { setCompanyName(e.target.value); setShowCompanyList(true); }} onFocus={() => setShowCompanyList(true)} placeholder="Search or enter company..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                {showCompanyList && filteredCompanies.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-20">
                    {filteredCompanies.map((c) => (
                      <button key={c} onClick={() => { setCompanyName(c); setShowCompanyList(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors">
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* IDENTITY */}
          <SectionHeader title="Identity" icon={Shield} expanded={sections.identity} onToggle={() => toggle('identity')} />
          {sections.identity && (
            <div className="space-y-4 p-4 bg-white border border-gray-100 rounded-lg">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Career Level</label>
                <SelectField options={CAREER_LEVELS} selected={careerLevel} onSelect={setCareerLevel} placeholder="Select career level..." />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Race / Ethnicity</label>
                <SelectField options={RACES} selected={race} onSelect={setRace} placeholder="Select race/ethnicity..." />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Gender</label>
                <SelectField options={GENDERS} selected={gender} onSelect={setGender} placeholder="Select gender..." />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Affinity Communities</label>
                <div className="flex flex-wrap gap-2">
                  {AFFINITY_TAGS.map((tag) => {
                    const sel = affinityTags.includes(tag.id);
                    return (
                      <button key={tag.id} onClick={() => setAffinityTags(sel ? affinityTags.filter((t) => t !== tag.id) : [...affinityTags, tag.id])}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${sel ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                        <span>{tag.icon}</span>
                        <span>{tag.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* MENTOR PROFILE */}
          {hasMentor && (
            <>
              <SectionHeader title="Mentor Profile" icon={Target} expanded={sections.mentor} onToggle={() => toggle('mentor')} />
              {sections.mentor && (
                <div className="space-y-4 p-4 bg-white border border-gray-100 rounded-lg">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Mentor Bio</label>
                    <textarea value={mentorBio} onChange={(e) => setMentorBio(e.target.value)} placeholder="Describe your mentoring approach..." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Areas of Expertise</label>
                    <MultiSelectDropdown label="expertise" options={filterOptions?.expertiseAreas || []} selected={expertise} onSelect={(v) => setExpertise([...expertise, v])} onRemove={(v) => setExpertise(expertise.filter((e) => e !== v))} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Industries</label>
                    <MultiSelectDropdown label="industry" options={filterOptions?.industries || []} selected={mentorIndustries} onSelect={(v) => setMentorIndustries([...mentorIndustries, v])} onRemove={(v) => setMentorIndustries(mentorIndustries.filter((i) => i !== v))} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Availability</label>
                    <SelectField options={filterOptions?.availabilityOptions?.length ? filterOptions.availabilityOptions : ['Weekly', 'Bi-weekly', 'Monthly', 'As needed']} selected={mentorAvail} onSelect={setMentorAvail} placeholder="Select availability..." />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Response Time</label>
                    <input type="text" value={responseTime} onChange={(e) => setResponseTime(e.target.value)} placeholder="e.g. within 24 hours" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Mentoring Style</label>
                    <input type="text" value={mentoringStyle} onChange={(e) => setMentoringStyle(e.target.value)} placeholder="e.g. Structured, Casual, Goal-oriented, Hands-on" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Languages</label>
                    <MultiSelectDropdown label="language" options={filterOptions?.languages || []} selected={mentorLangs} onSelect={(v) => setMentorLangs([...mentorLangs, v])} onRemove={(v) => setMentorLangs(mentorLangs.filter((l) => l !== v))} />
                  </div>
                </div>
              )}
            </>
          )}

          {/* MENTEE PROFILE */}
          {hasMentee && (
            <>
              <SectionHeader title="Mentee Profile" icon={BookOpen} expanded={sections.mentee} onToggle={() => toggle('mentee')} />
              {sections.mentee && (
                <div className="space-y-4 p-4 bg-white border border-gray-100 rounded-lg">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Mentee Bio</label>
                    <textarea value={menteeBio} onChange={(e) => setMenteeBio(e.target.value)} placeholder="What are you looking for..." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Goals</label>
                    <input type="text" value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="Your mentorship goals..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Areas of Interest</label>
                    <MultiSelectDropdown label="interest" options={filterOptions?.expertiseAreas || []} selected={interests} onSelect={(v) => setInterests([...interests, v])} onRemove={(v) => setInterests(interests.filter((i) => i !== v))} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Industries of Interest</label>
                    <MultiSelectDropdown label="industry" options={filterOptions?.industries || []} selected={menteeIndustries} onSelect={(v) => setMenteeIndustries([...menteeIndustries, v])} onRemove={(v) => setMenteeIndustries(menteeIndustries.filter((i) => i !== v))} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Availability</label>
                    <SelectField options={filterOptions?.availabilityOptions?.length ? filterOptions.availabilityOptions : ['Weekly', 'Bi-weekly', 'Monthly', 'As needed']} selected={menteeAvail} onSelect={setMenteeAvail} placeholder="Select availability..." />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Urgency</label>
                    <UrgencySelector value={urgency} onSelect={setUrgency} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Topic</label>
                    <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic of mentorship..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Preferred Mentoring Style</label>
                    <input type="text" value={mentoredStyle} onChange={(e) => setMentoredStyle(e.target.value)} placeholder="e.g. Structured sessions, Casual check-ins, Goal-oriented" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Languages</label>
                    <MultiSelectDropdown label="language" options={filterOptions?.languages || []} selected={menteeLangs} onSelect={(v) => setMenteeLangs([...menteeLangs, v])} onRemove={(v) => setMenteeLangs(menteeLangs.filter((l) => l !== v))} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Communication Method</label>
                    <SelectField options={filterOptions?.communicationMethods?.length ? filterOptions.communicationMethods : ['video-calls', 'phone-calls', 'chat-messaging', 'email', 'in-person']} selected={commMethod} onSelect={setCommMethod} placeholder="Select communication method..." />
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* Company Change Confirmation Modal */}
      {showCompanyConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Building className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Change Company?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Changing your company will <span className="font-semibold text-gray-900">reset your verification status</span> and you will be <span className="font-semibold text-gray-900">logged out</span> to apply the changes. You'll need to log in again.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowCompanyConfirm(false); pendingPayloadRef.current = null; }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCompanyChange}
                className="flex-1 px-4 py-2.5 bg-[#7c3aed] text-white rounded-lg text-sm font-semibold hover:bg-[#6d28d9] transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
