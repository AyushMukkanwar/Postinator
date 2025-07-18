import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  XIcon,
} from '@/components/icons';

export const getPlatformIcon = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'linkedin':
      return <LinkedInIcon />;
    case 'twitter':
    case 'x':
      return <XIcon />;
    case 'facebook':
      return <FacebookIcon />;
    case 'instagram':
      return <InstagramIcon />;
    default:
      return null;
  }
};
