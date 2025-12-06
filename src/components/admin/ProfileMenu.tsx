'use client';

import { useState, useEffect, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface AdminProfile {
    userId: string;
    username: string;
    profileImageUrl: string;
    email: string;
    updatedAt: any;
}

export default function ProfileMenu() {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [username, setUsername] = useState('');
    const [profileImage, setProfileImage] = useState('');
    const [uploading, setUploading] = useState(false);
    const [editingUsername, setEditingUsername] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Load profile data
    useEffect(() => {
        if (user?.uid) {
            loadProfile();
        }
    }, [user]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadProfile = async () => {
        if (!user?.uid) return;

        try {
            const profileRef = doc(db, 'adminProfiles', user.uid);
            const profileSnap = await getDoc(profileRef);

            if (profileSnap.exists()) {
                const data = profileSnap.data() as AdminProfile;
                setUsername(data.username || user.email?.split('@')[0] || 'Admin');
                setProfileImage(data.profileImageUrl || '');
            } else {
                // Create default profile
                const defaultUsername = user.email?.split('@')[0] || 'Admin';
                setUsername(defaultUsername);
                await setDoc(profileRef, {
                    userId: user.uid,
                    username: defaultUsername,
                    profileImageUrl: '',
                    email: user.email,
                    updatedAt: new Date()
                });
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user?.uid) return;

        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        try {
            setUploading(true);
            const timestamp = Date.now();
            const filename = `admin-profiles/${user.uid}/${timestamp}_${file.name}`;
            const storageRef = ref(storage, filename);

            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // Update Firestore
            const profileRef = doc(db, 'adminProfiles', user.uid);
            await setDoc(profileRef, {
                userId: user.uid,
                username,
                profileImageUrl: downloadURL,
                email: user.email,
                updatedAt: new Date()
            }, { merge: true });

            setProfileImage(downloadURL);
            alert('✅ Profile image updated!');
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleUsernameUpdate = async () => {
        if (!editingUsername.trim() || !user?.uid) return;

        try {
            const profileRef = doc(db, 'adminProfiles', user.uid);
            await setDoc(profileRef, {
                userId: user.uid,
                username: editingUsername,
                profileImageUrl: profileImage,
                email: user.email,
                updatedAt: new Date()
            }, { merge: true });

            setUsername(editingUsername);
            setShowEditModal(false);
            alert('✅ Username updated!');
        } catch (error) {
            console.error('Error updating username:', error);
            alert('Failed to update username');
        }
    };

    const getInitials = () => {
        return username.charAt(0).toUpperCase() || 'A';
    };

    return (
        <div className="profile-menu-container" ref={dropdownRef}>
            <div className="admin-user-profile" onClick={() => setIsOpen(!isOpen)}>
                <div className="admin-user-info">
                    <span className="admin-user-name">{username}</span>
                    <span className="admin-user-role">Admin</span>
                </div>
                <div className="admin-user-avatar">
                    {profileImage ? (
                        <img src={profileImage} alt={username} />
                    ) : (
                        getInitials()
                    )}
                </div>
            </div>

            {isOpen && (
                <div className="profile-dropdown">
                    <div className="dropdown-item" onClick={() => {
                        setEditingUsername(username);
                        setShowEditModal(true);
                        setIsOpen(false);
                    }}>
                        <span className="dropdown-icon">✏️</span>
                        Edit Username
                    </div>

                    <label className="dropdown-item" htmlFor="profileImageUpload">
                        <span className="dropdown-icon">📷</span>
                        {uploading ? 'Uploading...' : 'Change Photo'}
                        <input
                            type="file"
                            id="profileImageUpload"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading}
                            style={{ display: 'none' }}
                        />
                    </label>

                    <div className="dropdown-divider"></div>

                    <div className="dropdown-item" onClick={logout}>
                        <span className="dropdown-icon">🚪</span>
                        Logout
                    </div>
                </div>
            )}

            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Edit Username</h3>
                        <input
                            type="text"
                            value={editingUsername}
                            onChange={(e) => setEditingUsername(e.target.value)}
                            placeholder="Enter new username"
                            autoFocus
                        />
                        <div className="modal-actions">
                            <button onClick={() => setShowEditModal(false)} className="btn-cancel">
                                Cancel
                            </button>
                            <button onClick={handleUsernameUpdate} className="btn-save">
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .profile-menu-container {
                    position: relative;
                }

                .admin-user-profile {
                    cursor: pointer;
                    transition: opacity 0.2s;
                }

                .admin-user-profile:hover {
                    opacity: 0.8;
                }

                .admin-user-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 50%;
                }

                .profile-dropdown {
                    position: absolute;
                    top: calc(100% + 10px);
                    right: 0;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                    min-width: 200px;
                    z-index: 1000;
                    overflow: hidden;
                }

                .dropdown-item {
                    padding: 0.75rem 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                    transition: background 0.2s;
                    color: #374151;
                }

                .dropdown-item:hover {
                    background: #F9FAFB;
                }

                .dropdown-icon {
                    font-size: 1.2rem;
                }

                .dropdown-divider {
                    height: 1px;
                    background: #E5E7EB;
                    margin: 0.25rem 0;
                }

                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                }

                .modal-content {
                    background: white;
                    padding: 2rem;
                    border-radius: 16px;
                    width: 90%;
                    max-width: 400px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                }

                .modal-content h3 {
                    margin: 0 0 1.5rem 0;
                    color: #1F2937;
                }

                .modal-content input {
                    width: 100%;
                    padding: 0.75rem;
                    border: 2px solid #E5E7EB;
                    border-radius: 8px;
                    font-size: 1rem;
                    margin-bottom: 1.5rem;
                }

                .modal-content input:focus {
                    outline: none;
                    border-color: #FF6B9D;
                }

                .modal-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: flex-end;
                }

                .btn-cancel, .btn-save {
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }

                .btn-cancel {
                    background: #F3F4F6;
                    color: #374151;
                }

                .btn-cancel:hover {
                    background: #E5E7EB;
                }

                .btn-save {
                    background: linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%);
                    color: white;
                }

                .btn-save:hover {
                    background: linear-gradient(135deg, #E5427A 0%, #EC6FA1 100%);
                }
            `}</style>
        </div>
    );
}
