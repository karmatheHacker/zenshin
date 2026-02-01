import SearchBar from "./SearchBar";
import { Link } from "react-router-dom";
import kamanimeLogo from "../assets/kamanimeLogo.png";
import {
  DividerVerticalIcon,
  HeartIcon,
  PersonIcon,
  ShadowIcon,
  ShadowNoneIcon,
} from "@radix-ui/react-icons";
import { Button, DropdownMenu, Tooltip } from "@radix-ui/themes";
import { useZenshinContext } from "../utils/ContextProvider";
import { anilistAuthUrl } from "../utils/auth";
import { ANILIST_CLIENT_ID } from "../utils/auth";
import { useState } from "react";
import useGetAnilistProfile from "../hooks/useGetAnilistProfile";
import { toast } from "sonner";

export default function Header({ theme }) {
  const zenshinContext = useZenshinContext();
  function toggleGlow() {
    zenshinContext.setGlow(!zenshinContext.glow);
  }

  /* -------------------- ANILIST AUTH -------------------- */
  const [anilistToken, setAnilistToken] = useState(
    localStorage.getItem("anilist_token") || "",
  );

  const {
    isLoading,
    data: userProfile,
    error: userProfileError,
    status,
  } = useGetAnilistProfile(anilistToken);

  console.log("anilistToken: ", anilistToken);

  const handleLogin = () => {
    window.location.href = anilistAuthUrl;
  };

  const handleLogout = () => {
    localStorage.removeItem("anilist_token");
    localStorage.removeItem("anilist_id");
    localStorage.removeItem("anilist_name");
    setAnilistToken("");

    // refresh the page
    window.location.reload();
  };

  if (userProfileError) {
    toast.error("Error fetching Anilist Profile", {
      description: userProfileError?.message,
      classNames: {
        title: "text-rose-500",
      },
    });
  }

  return (
    <div className="sticky top-0 z-20 flex h-12 items-center justify-between border-[#5a5e6750] bg-[#111113] bg-opacity-60 px-4 py-3 backdrop-blur-md">
      <div className="flex items-center justify-center gap-x-4">
        <Link
          className="hover: font-spaceMono flex w-fit cursor-pointer select-none flex-col items-center justify-center gap-x-2 rounded-sm p-1 text-sm transition-all duration-200 hover:bg-[#70707030]"
          to={"/"}
        >
          <div className="relative flex flex-col items-center leading-none">
            <span className="font-bold text-white text-lg tracking-tighter">Kamanime.</span>
            <span className="absolute -bottom-1 text-[0.6rem] font-bold text-[#B026FF] opacity-80">カマニメ</span>
          </div>
        </Link>
        <DividerVerticalIcon width={20} height={20} color="#ffffff40" />
        <a
          href="https://discord.gg/AHhuDZskhe"
          target="_blank"
          rel="noreferrer"
          className="flex items-center"
        >
          <Button color="gray" variant="ghost" size={"1"}>
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="my-1"
            >
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.054-.108.001-.23-.106-.271a12.962 12.962 0 0 1-1.883-.894.083.083 0 0 1-.008-.137c.126-.094.252-.192.372-.29a.075.075 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.29a.083.083 0 0 1-.006.137 12.661 12.661 0 0 1-1.883.894.083.083 0 0 0-.106.27c.353.7.764 1.365 1.226 1.995.054.077.031.028.084.028a19.876 19.876 0 0 0 6.026-3.03.078.078 0 0 0 .032-.057c.487-5.187-.803-9.66-3.606-13.66a.066.066 0 0 0-.033-.027zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
          </Button>
        </a>
        <DividerVerticalIcon width={20} height={20} color="#ffffff40" />
        <Button color="gray" variant="ghost" size={"1"}>
          <Link to="/newreleases">
            <div className="p-1 font-space-mono text-[.8rem]">New Releases</div>
          </Link>
        </Button>
        <DividerVerticalIcon width={20} height={20} color="#ffffff40" />
        <Button color="gray" variant="ghost" size={"1"}>
          <Link to="/credits">
            <div className="p-1 font-space-mono text-[.8rem]">Credits</div>
          </Link>
        </Button>
      </div>

      <div className="w-2/6">
        <SearchBar />
      </div>
      <div className="flex items-center justify-center gap-x-4">
        {!anilistToken && (
          <Tooltip content="Login With Anilist">
            <Button
              color="gray"
              variant="ghost"
              size={"1"}
              onClick={handleLogin}
            >
              <PersonIcon className="my-1" width={16} height={16} />
            </Button>
          </Tooltip>
        )}
        {userProfile && (
          <DropdownMenu.Root modal={false}>
            <DropdownMenu.Trigger>
              <Button variant="ghost" color="gray">
                <div className="flex animate-fade items-center gap-x-2">
                  <img
                    src={userProfile.avatar.large}
                    alt="avatar"
                    className="h-6 w-6 rounded-full"
                  />
                  <div className="font-space-mono text-[.8rem]">
                    {userProfile.name}
                  </div>
                </div>
                <DropdownMenu.TriggerIcon />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item shortcut="⌘ N">Archive</DropdownMenu.Item>
              <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger>More</DropdownMenu.SubTrigger>
                <DropdownMenu.SubContent>
                  <DropdownMenu.Item>Move to project…</DropdownMenu.Item>
                  <DropdownMenu.Item>Move to folder…</DropdownMenu.Item>

                  <DropdownMenu.Separator />
                  <DropdownMenu.Item>Advanced options…</DropdownMenu.Item>
                </DropdownMenu.SubContent>
              </DropdownMenu.Sub>
              <DropdownMenu.Item color="red" onClick={handleLogout}>
                Logout
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        )}


        <Button
          color="gray"
          variant="ghost"
          size={"1"}
          onClick={() => toggleGlow()}
        >
          {zenshinContext.glow ? (
            <ShadowIcon className="my-1" width={16} height={16} />
          ) : (
            <ShadowNoneIcon className="my-1" width={16} height={16} />
          )}
        </Button>
      </div>
    </div>
  );
}
