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

const MENU_ITEMS = {
  profile: [
    {
      icon: "ix:user-profile-filled",
      label: "Your profile",
      action: "profile",
    },
    {
      icon: "ri:settings-3-fill",
      label: "Settings",
      action: "settings",
    },
    {
      icon: "famicons:notifications",
      label: "Notifications",
      action: "notifications",
    },
  ],
  account: [
    { icon: "solar:logout-3-bold", label: "Log out", action: "logout" },
  ],
};

export const UserDropdown = ({
  user,
  onAction = () => {},
}: {
  user: User & { initials: string };
  onAction?: (action: string) => void;
}) => {
  const renderMenuItem = (
    item: (typeof MENU_ITEMS)[keyof typeof MENU_ITEMS][number],
    index: number,
  ) => (
    <DropdownMenuItem
      key={index}
      className={cn("p-2 rounded-lg cursor-pointer")}
      onClick={() => onAction(item.action)}
    >
      <span className="flex items-center gap-1.5 font-medium">
        <Icon
          icon={item.icon}
          className={`size-5 ${"text-gray-500 dark:text-gray-400"}`}
        />
        {item.label}
      </span>
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer size-10 border border-white dark:border-gray-700">
          <AvatarImage
            src={user?.image ?? "/default-avatar.png"}
            alt={user?.name ?? user.initials}
          />
          <AvatarFallback>{user.initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="no-scrollbar w-[230px] rounded-2xl bg-gray-50 dark:bg-black/90 p-0"
        side="bottom"
        align="center"
      >
        <section className="bg-white dark:bg-gray-100/10 backdrop-blur-lg rounded-2xl p-1 shadow border border-gray-200 dark:border-gray-700/20">
          <div className="flex items-center p-2">
            <div className="flex-1 flex items-center gap-2">
              <div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
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
