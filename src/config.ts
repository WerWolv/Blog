import type {
  AnalyticsConfig,
  CommentConfig,
  GithubConfig,
  Link,
  PhotosConfig,
  PostConfig,
  ProjectConfig,
  Site,
  SkillsShowcaseConfig,
  SocialLink,
  TagsConfig,
} from '~/types'

//--- Readme Page Config ---
export const SITE: Site = {
  title: 'WerWolv',
  description: "WerWolv's Blog",
  website: 'https://werwolv.net/',
  lang: 'en',
  base: '/',
  author: 'WerWolv',
  ogImage: '/og-image.webp',
  transition: false,
}

export const HEADER_LINKS: Link[] = [
  {
    name: 'Posts',
    url: '/posts',
  },
  {
    name: 'Projects',
    url: '/projects',
  },
]

export const FOOTER_LINKS: Link[] = [
  {
    name: '$ ~/',
    url: '/',
  },
  {
    name: 'Posts',
    url: '/posts',
  },
  {
    name: 'Projects',
    url: '/projects',
  },
  {
    name: 'Tags',
    url: '/tags',
  },
]
// get icon https://icon-sets.iconify.design/
export const SOCIAL_LINKS: SocialLink[] = [
  {
    name: 'github',
    url: 'https://github.com/WerWolv',
    icon: 'icon-[ri--github-fill]',
    count: 20,
    hoverColor: 'text-primary',
  },
  {
    name: 'twitter',
    url: 'https://twitter.com/WerWolv',
    icon: 'icon-[ri--twitter-fill]',
    hoverColor: 'text-sky-400',
  },
  {
    name: 'discord',
    url: 'https://discordapp.com/users/181738643008782346',
    icon: 'icon-[ri--discord-fill]',
    hoverColor: 'text-indigo-400',
  },
]

/**
 * SkillsShowcase / SkillsShowcase configuration type
 * @property {boolean} SKILLS_ENABLED  - Whether to enable SkillsShowcase features
 * @property {Object} SKILLS_DATA - Skills showcase data
 * @property {string} SKILLS_DATA.direction - Skills showcase direction
 * @property {Object} SKILLS_DATA.skills - Skills showcase data
 * @property {string} SKILLS_DATA.skills.icon - Skills icon
 * @property {string} SKILLS_DATA.skills.name - Skills name
 * get icon https://icon-sets.iconify.design/
 */
import altiumIcon from '/src/assets/altium-designer-icon.png'
import imhexIcon from '/src/assets/imhex-icon.svg'
export const SKILLSSHOWCASE_CONFIG: SkillsShowcaseConfig = {
  SKILLS_ENABLED: true,
  SKILLS_DATA: [
    {
      direction: 'left',
      skills: [
        {
          name: 'C++',
          icon: 'icon-[skill-icons--cpp]',
          url: 'https://cppreference.com/',
        },
        {
          name: 'C',
          icon: 'icon-[skill-icons--c]',
          url: 'https://cppreference.com/',
        },
        {
          name: 'Assembly',
          icon: 'icon-[logos--arm]',
          url: 'https://www.arm.com/',
        },
        {
          name: 'Shell',
          icon: 'icon-[skill-icons--bash-dark]',
          url: 'https://www.gnu.org/software/bash/',
        },
        {
          name: 'Rust',
          icon: 'icon-[skill-icons--rust]',
          url: 'https://rust-lang.org/',
        },
        {
          name: 'C#',
          icon: 'icon-[skill-icons--cs]',
          url: 'https://dotnet.microsoft.com/',
        },
        {
          name: 'Python',
          icon: 'icon-[material-icon-theme--python]',
          url: 'https://www.python.org/',
        },
        {
          name: 'VHDL',
          icon: 'icon-[skill-icons--verilog]',
          url: 'https://www.altera.com/',
        },
      ],
    },
    {
      direction: 'right',
      skills: [
        {
          name: 'Ghidra',
          icon: 'icon-[devicon--ghidra]',
          url: 'https//www.nsa.gov/ghidra/',
        },
        {
          name: 'ImHex',
          icon: imhexIcon,
          url: 'https://imhex.werwolv.net/',
        },
        {
          name: 'JetBrains Suite',
          icon: 'icon-[logos--jetbrains-icon]',
          url: 'https://www.jetbrains.com/',
        },
        {
          name: 'Vim',
          icon: 'icon-[devicon--vim]',
          url: 'https://www.vim.org/',
        },
        {
          name: 'Altium Designer',
          icon: altiumIcon,
          url: 'https://www.altium.com/',
        },
      ],
    },
    {
      direction: 'left',
      skills: [
        {
          name: 'Linux',
          icon: 'icon-[flat-color-icons--linux]',
          url: 'https://kernel.org/',
        },
        {
          name: 'PCB Design',
          icon: 'icon-[mdi--integrated-circuit]',
          url: 'https://yggdrasil.werwolv.net/',
        },
        {
          name: 'Git',
          icon: 'icon-[skill-icons--git]',
          url: 'https://git-scm.com/',
        },
        {
          name: 'Reverse Engineering',
          icon: 'icon-[pixelarticons--binary-sharp]',
          url: 'https://github.com/Atmosphere-NX/Atmosphere/',
        },
      ],
    },
  ],
}

/**
 * GitHub configuration
 *
 * @property {boolean} ENABLED - Whether to enable GitHub features
 * @property {string} GITHUB_USERNAME - GitHub username
 * @property {boolean} TOOLTIP_ENABLED - Whether to enable Github Tooltip features
 */

export const GITHUB_CONFIG: GithubConfig = {
  ENABLED: true,
  GITHUB_USERNAME: 'WerWolv',
  TOOLTIP_ENABLED: true,
}

//--- Posts Page Config ---
export const POSTS_CONFIG: PostConfig = {
  title: 'Posts',
  description: 'Posts by WerWolv',
  introduce: 'All my posts about various subjects that interest me',
  author: 'WerWolv',
  homePageConfig: {
    size: 5,
    type: 'image',
  },
  postPageConfig: {
    size: 10,
    type: 'image',
    coverLayout: 'right',
  },
  tagsPageConfig: {
    size: 10,
    type: 'time-line',
  },
  ogImageUseCover: true,
  postType: 'coverSplit',
  imageDarkenInDark: false,
  readMoreText: 'Read more',
  prevPageText: 'Previous',
  nextPageText: 'Next',
  tocText: 'Table of Contents',
  backToPostsText: 'Back to Posts',
  nextPostText: 'Next Post',
  prevPostText: 'Previous Post',
  recommendText: undefined,
  wordCountView: true,
}

export const COMMENT_CONFIG: CommentConfig = {
  enabled: true,
  system: 'gitalk',
  gitalk: {
    clientID: import.meta.env.PUBLIC_GITHUB_CLIENT_ID,
    clientSecret: import.meta.env.PUBLIC_GITHUB_CLIENT_SECRET,
    repo: 'gitalk-comment',
    owner: 'WerWolv',
    admin: ['WerWolv'],
    language: 'en-US',
    perPage: 5,
    pagerDirection: 'last',
    createIssueManually: false,
    distractionFreeMode: false,
    enableHotKey: true,
  },
}

export const TAGS_CONFIG: TagsConfig = {
  title: 'Tags',
  description: 'All tags of Posts',
  introduce: 'All the tags for posts are here, you can click to filter them.',
}

export const PROJECTS_CONFIG: ProjectConfig = {
  title: 'Projects',
  description: 'The things I spend my time on',
  introduce: 'The things I spend my time on',
}

export const PHOTOS_CONFIG: PhotosConfig = {
  title: 'Photos',
  description: 'Here I will record some photos taken in daily life.',
  introduce: 'Here I will record some photos taken in daily life.',
}

export const ANALYTICS_CONFIG: AnalyticsConfig = {
  vercount: {
    enabled: true,
  },
  umami: {
    enabled: false,
    websiteId: 'Your websiteId in umami',
    serverUrl: 'https://cloud.umami.is/script.js',
  },
}
