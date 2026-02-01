import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { Button } from "@radix-ui/themes";
import kamanimeAvatar from "../assets/kamanime_avatar.jpg";

export default function Credits() {
    return (
        <div className="flex min-h-[85vh] w-full flex-col items-center justify-center gap-y-12 py-10 font-space-mono animate-fade">
            <div className="flex flex-col items-center gap-y-3 text-center">
                <h1 className="text-5xl font-bold tracking-tighter text-white drop-shadow-lg">
                    Credits
                </h1>
                <p className="text-sm font-medium tracking-wide text-gray-400 uppercase">
                    The minds behind the code
                </p>
            </div>

            <div className="flex flex-wrap justify-center gap-8 px-4">
                {/* Card for Original Developer */}
                <div className="group relative flex w-80 flex-col gap-y-5 rounded-xl border border-[#ffffff15] bg-[#111113] p-6 shadow-xl transition-all duration-300 hover:border-[#B026FF] hover:-translate-y-1 hover:shadow-[0_0_30px_-10px_#B026FF50]">
                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-[#ffffff20] to-transparent group-hover:via-[#B026FF]"></div>

                    <div className="mx-auto h-24 w-24 overflow-hidden rounded-full border-2 border-[#ffffff10] shadow-inner group-hover:border-[#B026FF]">
                        <img
                            src="https://github.com/hitarth-gg.png"
                            alt="hitarth-gg"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    </div>

                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white group-hover:text-[#B026FF] transition-colors">hitarth-gg</h2>
                        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">
                            Original Creator
                        </p>
                        <p className="text-sm leading-relaxed text-gray-400">
                            Creator of Zenshin. Built the core architecture, streaming logic, and laid the foundation for the application.
                        </p>
                    </div>

                    <div className="mt-auto pt-2">
                        <a
                            href="https://github.com/hitarth-gg"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Button
                                variant="surface"
                                color="gray"
                                className="w-full cursor-pointer gap-2 transition-all hover:bg-white hover:text-black"
                            >
                                <GitHubLogoIcon />
                                GitHub Profile
                            </Button>
                        </a>
                    </div>
                </div>

                {/* Card for Kamanime/Discord */}
                <div className="group relative flex w-80 flex-col gap-y-5 rounded-xl border border-[#ffffff15] bg-[#111113] p-6 shadow-xl transition-all duration-300 hover:border-[#5865F2] hover:-translate-y-1 hover:shadow-[0_0_30px_-10px_#5865F250]">
                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-[#ffffff20] to-transparent group-hover:via-[#5865F2]"></div>

                    <div className="mx-auto h-24 w-24 overflow-hidden rounded-full border-2 border-[#ffffff10] bg-[#111113] shadow-inner group-hover:border-[#5865F2]">
                        <img
                            src={kamanimeAvatar}
                            alt="Kamanime"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    </div>

                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white group-hover:text-[#5865F2] transition-colors">Kamanime</h2>
                        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">
                            Rebranding & Updates
                        </p>
                        <p className="text-sm leading-relaxed text-gray-400">
                            Optimized backend with Torrent Caching (99% faster load times), Automatic Cleanup to prevent memory leaks, and Rate Limiting for enhanced security.
                        </p>
                    </div>

                    <div className="mt-auto pt-2">
                        <a
                            href="https://discord.gg/AHhuDZskhe"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Button
                                variant="surface"
                                color="indigo" // Using indigo for Discord-ish color
                                className="w-full cursor-pointer gap-2 transition-all hover:brightness-110"
                            >
                                {/* Simple Discord Icon SVG if not imported, or just text */}
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.054-.108.001-.23-.106-.271a12.962 12.962 0 0 1-1.883-.894.083.083 0 0 1-.008-.137c.126-.094.252-.192.372-.29a.075.075 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.29a.083.083 0 0 1-.006.137 12.661 12.661 0 0 1-1.883.894.083.083 0 0 0-.106.27c.353.7.764 1.365 1.226 1.995.054.077.031.028.084.028a19.876 19.876 0 0 0 6.026-3.03.078.078 0 0 0 .032-.057c.487-5.187-.803-9.66-3.606-13.66a.066.066 0 0 0-.033-.027zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                                </svg>
                                Join Discord
                            </Button>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
