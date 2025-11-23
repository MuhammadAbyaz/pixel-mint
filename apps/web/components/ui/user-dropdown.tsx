import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { type User } from "next-auth";
import { signOut } from "next-auth/react";
import Link from "next/link";

export const UserDropdown = ({
  user,
}: {
  user: User & { initials: string };
}) => {
  const MENU_ITEMS = {
    profile: [
      {
        icon: "ix:user-profile-filled",
        label: "Your profile",
        href: user.id ? `/profile/${user.id}` : "/auth/login",
        action: () => {},
      },
      {
        icon: "ri:settings-3-fill",
        label: "Settings",
        href: "/settings",
        action: () => {},
      },
      {
        icon: "famicons:notifications",
        label: "Notifications",
        href: "/notifications",
        action: () => {},
      },
    ],
    account: [
      {
        icon: "solar:logout-3-bold",
        label: "Log out",
        href: "/auth/login",
        action: () => signOut(),
      },
    ],
  };
  const renderMenuItem = (
    item: (typeof MENU_ITEMS)[keyof typeof MENU_ITEMS][number],
    index: number,
  ) => (
    <DropdownMenuItem
      key={index}
      className={cn("p-2 rounded-lg cursor-pointer")}
      onClick={item.action ?? undefined}
    >
      <Link
        className="flex items-center gap-1.5 font-medium"
        href={item.href ?? "#"}
      >
        <Icon icon={item.icon} className="size-5 text-muted-foreground" />
        {item.label}
      </Link>
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer size-10 border border-border">
          <AvatarImage
            src={user?.image ?? "/default-avatar.png"}
            alt={user?.name ?? user.initials}
          />
          <AvatarFallback>{user.initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="no-scrollbar w-[230px] rounded-2xl bg-card/90 backdrop-blur-lg p-0"
        side="bottom"
        align="center"
      >
        <section className="bg-card backdrop-blur-lg rounded-2xl p-1 shadow border border-border">
          <div className="flex items-center p-2">
            <div className="flex-1 flex items-center gap-2">
              <div>
                <h3 className="font-semibold text-sm text-foreground">
                  {user.name}
                </h3>
                <p className="text-muted-foreground text-xs">{user.email}</p>
              </div>
            </div>
          </div>

          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {MENU_ITEMS.profile.map(renderMenuItem)}
          </DropdownMenuGroup>
        </section>

        <section className="mt-1 p-1 rounded-2xl">
          <DropdownMenuGroup>
            {MENU_ITEMS.account.map(renderMenuItem)}
          </DropdownMenuGroup>
        </section>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;
