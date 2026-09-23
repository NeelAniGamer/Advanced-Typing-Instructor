import React, { useState } from 'react';

interface UserAvatarProps {
  avatar?: string | null;
  name?: string;
  className?: string;
  fallback?: string;
  imgClassName?: string;
}

/**
 * Checks if the given avatar string is an image URL (http, https, data URI, blob).
 */
export const isAvatarUrl = (avatar?: string | null): boolean => {
  if (!avatar || typeof avatar !== 'string') return false;
  const trimmed = avatar.trim();
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:')
  );
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatar,
  name,
  className = 'w-10 h-10 rounded-xl text-lg',
  fallback = '👑',
  imgClassName = 'w-full h-full object-cover rounded-[inherit]',
}) => {
  const [imgError, setImgError] = useState(false);
  const isUrl = isAvatarUrl(avatar);

  if (isUrl && !imgError && avatar) {
    return (
      <div className={`overflow-hidden flex items-center justify-center select-none flex-shrink-0 relative ${className}`}>
        <img
          src={avatar}
          alt={name ? `${name}'s avatar` : 'User avatar'}
          className={imgClassName}
          referrerPolicy="no-referrer"
          loading="lazy"
          crossOrigin="anonymous"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Fallback / Emoji
  const displayEmoji = (!avatar || isUrl) ? fallback : avatar;

  return (
    <div className={`overflow-hidden flex items-center justify-center select-none flex-shrink-0 ${className}`}>
      <span className="truncate leading-none select-none">{displayEmoji}</span>
    </div>
  );
};
