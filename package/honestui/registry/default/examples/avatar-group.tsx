import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/registry/default/ui/avatar";

export default function AvatarGroupDemo() {
  return (
    <AvatarGroup aria-label="Project collaborators">
      <Avatar>
        <AvatarImage
          src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=96&h=96&dpr=2&q=80"
          alt="Morgan Lee"
        />
        <AvatarFallback>U1</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage
          src="https://images.unsplash.com/photo-1628157588553-5eeea00af15c?w=96&h=96&dpr=2&q=80"
          alt="Avery Patel"
        />
        <AvatarFallback>U2</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage
          src="https://images.unsplash.com/photo-1655874819398-c6dfbec68ac7?w=96&h=96&dpr=2&q=80"
          alt="Jordan Kim"
        />
        <AvatarFallback>U3</AvatarFallback>
      </Avatar>
      <AvatarGroupCount aria-label="3 more collaborators">+3</AvatarGroupCount>
    </AvatarGroup>
  );
}
