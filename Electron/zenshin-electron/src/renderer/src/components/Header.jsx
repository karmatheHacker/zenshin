import SearchBar from './SearchBar'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import kamanimeLogo from '../assets/kamanimeLogo.png'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  DividerVerticalIcon,
  DownloadIcon,
  ExclamationTriangleIcon,
  GearIcon,
  LayersIcon,
  LightningBoltIcon,
  OpenInNewWindowIcon,
  PersonIcon
} from '@radix-ui/react-icons'
import Pikacon from '../assets/pikacon.ico'
import { Button, DropdownMenu, Tooltip } from '@radix-ui/themes'
import { anilistAuthUrl } from '../utils/auth'
import { useEffect, useState } from 'react'
import useGetAnilistProfile from '../hooks/useGetAnilistProfile'
import { toast } from 'sonner'
import axios from 'axios'
import AnimePaheSearchBar from '../extensions/animepahe/components/AnimePaheSearchBar'
import AniListLogo from '../assets/symbols/AniListLogo'
import { useZenshinContext } from '../utils/ContextProvider'
import DownloadMeter from './DownloadMeter'

export default function Header() {
  const navigate = useNavigate()
  const { setUserId, backendPort, settings } = useZenshinContext()

  const checkBackendRunning = async () => {
    let mainJsBP = await window.api.getSettingsJson()
    try {
      // const response = await axios.get(`http://localhost:${backendPort}/ping`)
      const response = await axios.get(`http://localhost:${backendPort}/ping`)
      // console.log(response)

      if (response.status === 200) {
        toast.success('Backend is running', {
          icon: <LightningBoltIcon height="16" width="16" color="#ffffff" />,
          description: `Backend is running on your local machine: ${backendPort} - ${mainJsBP.backendPort}`,
          classNames: {
            title: 'text-green-500'
          }
        })
      }
    } catch (error) {
      toast.error('Backend is not running', {
        icon: <ExclamationTriangleIcon height="16" width="16" color="#ffffff" />,
        description: `Backend is not running on your local machine: ${backendPort} - ${mainJsBP.backendPort}`,
        classNames: {
          title: 'text-rose-500'
        }
      })

      console.error('Error checking if the backend is running', error)
    }
  }

  /* -------------------- ANILIST AUTH -------------------- */
  const [anilistToken, setAnilistToken] = useState(localStorage.getItem('anilist_token') || '')

  useEffect(() => {
    window.electron.receiveDeeplink((deeplink) => {
      // console.log('Deeplink received in React app:', link)
      const arr = deeplink.split('#')
      const hash = arr[1]
      const params = new URLSearchParams(hash)
      const accessToken = params.get('access_token')

      if (accessToken) {
        // Store the access token in local storage
        localStorage.setItem('anilist_token', accessToken)
        // refresh the page
        window.location.reload()
      }
    })
  }, [])

  const {
    isLoading,
    data: userProfile,
    error: userProfileError,
    status
  } = useGetAnilistProfile(anilistToken)

  useEffect(() => {
    if (userProfile) {
      setUserId(userProfile.id)
    }
  }, [userProfile])

  // console.log('anilistToken: ', anilistToken)

  const handleLogin = () => {
    // window.location.href = anilistAuthUrl
    // shell.openExternal(anilistAuthUrl)
    window.api.oauth(anilistAuthUrl)
  }

  const handleLogout = () => {
    localStorage.removeItem('anilist_token')
    localStorage.removeItem('anilist_id')
    localStorage.removeItem('anilist_name')
    setAnilistToken('')
    setUserId('')

    // refresh the page
    window.location.reload()
  }

  if (userProfileError) {
    toast.error('Error fetching AniList Profile', {
      description: userProfileError?.message,
      classNames: {
        title: 'text-rose-500'
      }
    })
  }
  // async function getSettingsJson() {
  //   let data = await window.api.getSettingsJson()
  //   setSettingsJson(data)
  // }

  // get current route and check if it is /animepahe
  const { pathname } = useLocation()

  const animepahe = pathname.includes('/animepahe')

  return (
    <div className="draggable sticky top-0 z-50 flex h-11 items-center justify-between border-[#5a5e6750] bg-[#111113] bg-opacity-60 px-4 py-3 backdrop-blur-md">
      <div className="nodrag flex items-center justify-center gap-x-2">
        <Link
          className="nodrag hover: font-spaceMono flex w-fit cursor-pointer select-none flex-col items-center justify-center gap-x-2 rounded-sm p-1 text-sm transition-all duration-200 hover:bg-[#70707030]"
          to={'/'}
        >
          <div className="relative flex flex-col items-center leading-none">
            <span className="font-bold text-white text-lg tracking-tighter">Kamanime.</span>
            <span className="absolute -bottom-1 text-[0.6rem] font-bold text-[#B026FF] opacity-85">カマニメ</span>
          </div>
        </Link>
        {/* <DividerVerticalIcon width={20} height={20} color="#ffffff40" /> */}
        {/* <a className="nodrag" href="https://github.com/hitarth-gg" target="_blank" rel="noreferrer">
          <Button color="gray" variant="ghost" size={'1'}>
            <GitHubLogoIcon className="my-1" width={17} height={17} />
          </Button>
        </a> */}

        <DividerVerticalIcon width={20} height={20} color="#ffffff40" />
        <div className="flex gap-4">
          <Button color="gray" variant="ghost" size={'1'} onClick={() => navigate(-1)}>
            <ArrowLeftIcon className="my-1" width={16} height={16} />
          </Button>
          <Button color="gray" variant="ghost" size={'1'} onClick={() => navigate(1)}>
            <ArrowRightIcon className="my-1" width={16} height={16} />
          </Button>
        </div>
        <DividerVerticalIcon width={20} height={20} color="#ffffff40" />
        <Link to="/newreleases">
          <Button className="nodrag" color="gray" variant="soft" size={'1'}>
            {/* <div className="p-1 font-space-mono text-[.8rem]">New Releases</div> */}
            <div className="font-space-mono text-[.8rem]">New</div>
          </Button>
        </Link>
        {/* <DividerVerticalIcon width={20} height={20} color="#ffffff40" /> */}
        <Button
          className="nodrag"
          size="1"
          color="gray"
          variant="soft"
          onClick={() => navigate('/animepahe')}
        >
          {/* <DashboardIcon /> */}
          <img src={Pikacon} alt="pikacon" className="h-4 w-4" />
        </Button>

        {/* <DividerVerticalIcon width={20} height={20} color="#ffffff40" /> */}

        <Button
          className="nodrag"
          size="1"
          color="gray"
          variant="soft"
          onClick={() => navigate('/anilist')}
          style={{
            padding: '0 .4rem'
          }}
        >
          {/* <DashboardIcon /> */}
          <AniListLogo style="h-5 w-5" />
        </Button>
        {/* <Button
          className="nodrag"
          size="1"
          color="gray"
          variant="soft"
          onClick={() => navigate('/bookmarks')}
        >
          <BookmarkIcon />
        </Button> */}
      </div>

      <div className="nodrag mx-5 w-2/6">{animepahe ? <AnimePaheSearchBar /> : <SearchBar />}</div>
      <div className="nodrag mr-36 flex items-center justify-center gap-x-4">
        <Button color="gray" variant="soft" size={'1'} onClick={() => navigate('/downloads')}>
          <DownloadIcon />
        </Button>
        <DownloadMeter />

        {true && (
          <DropdownMenu.Root className="nodrag" modal={false}>
            <DropdownMenu.Trigger>
              <Button variant="ghost" color="gray">
                <div className="flex animate-fade items-center gap-x-2">
                  {userProfile ? (
                    <img
                      src={userProfile.avatar.large}
                      alt="avatar"
                      className="h-6 w-6 rounded-full"
                    />
                  ) : (
                    <PersonIcon className="my-1" width={16} height={16} />
                  )}
                  <div className="font-space-mono text-[.8rem]">
                    {userProfile?.name || 'anonuser'}
                  </div>
                </div>
                <DropdownMenu.TriggerIcon className="ml-1" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item
                onClick={() => window.open('https://discord.gg/AHhuDZskhe', '_blank')}
                shortcut={<OpenInNewWindowIcon />}
              >
                Discord{' '}
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{ marginLeft: '4px' }}
                >
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.054-.108.001-.23-.106-.271a12.962 12.962 0 0 1-1.883-.894.083.083 0 0 1-.008-.137c.126-.094.252-.192.372-.29a.075.075 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.29a.083.083 0 0 1-.006.137 12.661 12.661 0 0 1-1.883.894.083.083 0 0 0-.106.27c.353.7.764 1.365 1.226 1.995.054.077.031.028.084.028a19.876 19.876 0 0 0 6.026-3.03.078.078 0 0 0 .032-.057c.487-5.187-.803-9.66-3.606-13.66a.066.066 0 0 0-.033-.027zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                color="green"
                onClick={checkBackendRunning}
                shortcut={<LayersIcon />}
              >
                Ping Backend
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onClick={() => window.api.openFolder(settings.downloadsFolderPath)}
                shortcut={<DownloadIcon />}
              >
                Downloads
              </DropdownMenu.Item>
              <DropdownMenu.Item
                color="gray"
                onClick={() => navigate('/settings')}
                shortcut={<GearIcon />}
              >
                Settings
              </DropdownMenu.Item>
              {/* <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger>More</DropdownMenu.SubTrigger>
                <DropdownMenu.SubContent>
                  <DropdownMenu.Item>Move to project…</DropdownMenu.Item>
                  <DropdownMenu.Item>Move to folder…</DropdownMenu.Item>

                  <DropdownMenu.Separator />
                  <DropdownMenu.Item>Advanced options…</DropdownMenu.Item>
                </DropdownMenu.SubContent>
              </DropdownMenu.Sub> */}
              <DropdownMenu.Separator />
              {userProfile ? (
                <DropdownMenu.Item color="red" onClick={handleLogout}>
                  Logout
                </DropdownMenu.Item>
              ) : (
                <DropdownMenu.Item color="green" onClick={handleLogin}>
                  Login With AniList
                </DropdownMenu.Item>
              )}
              {/* <Button color='gray' onClick={() => navigate('/test')}>Test</Button> */}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        )}

        {/* <Link target="_blank" to="https://github.com/hitarth-gg/zenshin"> */}
        {/* <Button color="gray" variant="ghost" size={'1'}> */}
        {/* <div className="p-1 text-[.8rem]">How to use</div> */}
        {/* </Button> */}
        {/* </Link> */}
        {/* <Button
          className="nodrag"
          color="gray"
          variant="ghost"
          size={'1'}
          // onClick={() => toggleGlow()}
          onClick={() => navigate('/settings')}
          style={{
            padding: '0 1rem'
          }}
        >
          <GearIcon className="my-1 cursor-pointer" width={16} height={16} />
        </Button> */}
      </div>
    </div>
  )
}
