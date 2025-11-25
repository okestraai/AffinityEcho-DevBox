// src/components/forums/company/CompanyMode.tsx

import { ArrowLeft, Search, Plus } from "lucide-react";
import { CreateTopicModal } from "../../Modals/CreateTopicModal";
import { TopicDetailModal } from "../../Modals/TopicDetailModal";
import { UserProfileModal } from "../../Modals/UserProfileModal";

export function CompanyMode(props: any) {
  const {
    currentUser,
    selectedCompany,
    searchTerm,
    setSearchTerm,
    showCreateModal,
    setShowCreateModal,
    showTopicDetail,
    setShowTopicDetail,
    showUserProfile,
    setShowUserProfile,
    selectedUserProfile,
    selectedTopic,
    handleUserClick,
    handleBackToOverview,
    companies,
  } = props;

  const company = companies.find((c: any) => c.id === selectedCompany);
  if (!company) return null;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Company Header */}
      <header className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-200/50 p-8 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBackToOverview}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
            {company.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
            <p className="text-gray-600">
              {company.memberCount} anonymous members
            </p>
          </div>
        </div>
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
          <input
            type="text"
            placeholder={`Search ${company.name} forums...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-6 py-4 bg-gray-50/80 backdrop-blur-sm rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:bg-white outline-none transition-all border-2 border-gray-200 focus:border-purple-500 text-gray-900 placeholder-gray-500 font-medium hover:border-gray-300 text-lg"
          />
        </div>
      </header>

      {/* Company Forums Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {company.forums.map((forum: any) => (
          <button
            key={forum.id}
            onClick={() => props.handleForumSelect(forum.id)}
            className="text-left bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all group"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{forum.icon}</span>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                {forum.name}
              </h3>
            </div>
            <p className="text-gray-600 mb-4 leading-relaxed">
              {forum.description}
            </p>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-lg font-bold text-blue-600">
                  {forum.topicCount}
                </div>
                <div className="text-xs text-blue-700 font-medium">Topics</div>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-lg font-bold text-purple-600">
                  {forum.memberCount}
                </div>
                <div className="text-xs text-purple-700 font-medium">
                  Members
                </div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
                <div className="text-xs font-bold text-green-600">
                  {forum.lastActivity}
                </div>
                <div className="text-xs text-green-700 font-medium">Last</div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <span className="text-sm text-purple-600 font-medium group-hover:text-purple-700 transition-colors">
                View Forum
              </span>
            </div>
          </button>
        ))}
      </div>

      <CreateTopicModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        forumName={company.name}
        companyId={selectedCompany}
      />
      <TopicDetailModal
        isOpen={showTopicDetail}
        onClose={() => setShowTopicDetail(false)}
        topic={selectedTopic}
        onUserClick={handleUserClick}
      />
      <UserProfileModal
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        profile={selectedUserProfile}
        onFollow={props.handleFollow}
        onUnfollow={props.handleUnfollow}
        onChat={props.handleChat}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}
