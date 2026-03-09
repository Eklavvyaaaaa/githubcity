import { useState, useEffect } from 'react'
import useStore from '../store/store'
import { playUIClick } from '../services/audio'
import './ProfilePage.css'

function ProfilePage() {
    const showProfilePage = useStore((s) => s.showProfilePage)
    const setShowProfilePage = useStore((s) => s.setShowProfilePage)
    const username = useStore((s) => s.username)
    const repos = useStore((s) => s.repos)
    const contributions = useStore((s) => s.contributions)

    if (!showProfilePage) return null

    // Calculate Stats
    const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0)
    const totalForks = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0)
    const languages = [...new Set(repos.map(r => r.language).filter(Boolean))]

    // Top 3 Starred Repos
    const topRepos = [...repos].sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0)).slice(0, 3)

    // Dynamic Achievements
    const achievements = []
    if (contributions > 500) achievements.push({ icon: '🔥', title: 'Code Machine', desc: 'Over 500 contributions' })
    if (totalStars > 100) achievements.push({ icon: '⭐', title: 'Star Gazer', desc: 'Over 100 total stars' })
    if (languages.length >= 5) achievements.push({ icon: '🌐', title: 'Polyglot', desc: 'Uses 5+ languages' })
    if (totalForks > 50) achievements.push({ icon: '🔱', title: 'Influencer', desc: 'Repos forked 50+ times' })

    // Add defaults if few
    if (achievements.length === 0) achievements.push({ icon: '🌱', title: 'Open Source Journey', desc: 'Building the GitHub City' })
    if (achievements.length < 2 && repos.length > 10) achievements.push({ icon: '🏗️', title: 'Architect', desc: 'Built 10+ Repositories' })

    const closeProfile = () => {
        playUIClick()
        setShowProfilePage(false)
    }

    return (
        <div className="profile-overlay fadeIn">
            <div className="profile-modal">
                <button className="profile-close" onClick={closeProfile}>✕</button>

                <div className="profile-header">
                    <img src={`https://github.com/${username}.png`} alt={username} className="profile-avatar" />
                    <h2>@{username}</h2>
                    <div className="profile-title">Gitscape Architect</div>
                </div>

                <div className="profile-stats-grid">
                    <div className="profile-stat-box">
                        <span className="stat-label">Contributions</span>
                        <span className="stat-value">{contributions.toLocaleString()}</span>
                    </div>
                    <div className="profile-stat-box">
                        <span className="stat-label">Repositories</span>
                        <span className="stat-value">{repos.length}</span>
                    </div>
                    <div className="profile-stat-box">
                        <span className="stat-label">Total Stars</span>
                        <span className="stat-value">{totalStars}</span>
                    </div>
                </div>

                <div className="profile-section">
                    <h3>🏆 Achievements</h3>
                    <div className="achievements-list">
                        {achievements.map((ach, i) => (
                            <div key={i} className="achievement-card">
                                <span className="achievement-icon">{ach.icon}</span>
                                <div className="achievement-text">
                                    <h4>{ach.title}</h4>
                                    <p>{ach.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="profile-section">
                    <h3>⭐ Top Repositories</h3>
                    <div className="top-repos-list">
                        {topRepos.map(repo => (
                            <a key={repo.id} href={repo.html_url} target="_blank" rel="noreferrer" className="top-repo-card">
                                <div className="top-repo-header">
                                    <h4>{repo.name}</h4>
                                    <span className="top-repo-stars">★ {repo.stargazers_count}</span>
                                </div>
                                <p>{repo.description || 'No description provided.'}</p>
                            </a>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}

export default ProfilePage
