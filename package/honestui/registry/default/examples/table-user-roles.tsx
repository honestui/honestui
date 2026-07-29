import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/default/ui/table"

const users = [["Nora", "Admin"], ["Leo", "Editor"], ["Mia", "Viewer"]]

export default function TableUserRoles() {
  return (
    <div className="w-full max-w-sm">
      <Table className="text-sm">
        <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Role</TableHead></TableRow></TableHeader>
        <TableBody>{users.map(([user, role]) => <TableRow key={user}><TableCell>{user}</TableCell><TableCell>{role}</TableCell></TableRow>)}</TableBody>
      </Table>
    </div>
  )
}
